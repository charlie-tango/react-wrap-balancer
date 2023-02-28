import React from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

interface WrapperElement extends HTMLElement {
  __observer?: ResizeObserver | undefined;
}

type RelayoutFn = (
  id: string | number,
  ratio: number,
  wrapper?: WrapperElement
) => void;

declare global {
  interface Window {
    __relayoutText: RelayoutFn;
  }
}

export const relayout: RelayoutFn = (id, ratio, wrapper) => {
  wrapper =
    wrapper || document.querySelector<WrapperElement>(`[data-br="${id}"]`);
  const container = wrapper.parentElement;

  const update = (width: number) => (wrapper.style.maxWidth = width + "px");

  // Reset wrapper width
  wrapper.style.maxWidth = "";

  // Get the initial container size
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Synchronously do binary search and calculate the layout
  let lower: number = width / 2 - 0.25;
  let upper: number = width + 0.5;
  let middle: number;

  if (width) {
    while (lower + 1 < upper) {
      middle = Math.round((lower + upper) / 2);
      update(middle);
      if (container.clientHeight === height) {
        upper = middle;
      } else {
        lower = middle;
      }
    }

    // Update the wrapper width
    update(upper * ratio + width * (1 - ratio));
  }

  // Create a new observer if we don't have one.
  // Note that we must inline the key here as we use `toString()` to serialize
  // the function.
  if (!wrapper["__observer"]) {
    (wrapper["__observer"] = new ResizeObserver(() => {
      self.__relayoutText(0, +wrapper.dataset.brr, wrapper);
    })).observe(container);
  }
};

/**
 * Pre-minified version of the `relayout` function. This allows the code to be used with `tsx`, that would otherwise break the minified code, because it doesn't `--keep-names`.
 * If the `relayout()` is changed, this must be updated as well - Grab the output from the compiled `dist/index.js`.
 */
export const staticRelayout =
  '(c,n,e)=>{e=e||document.querySelector(`[data-br="${c}"]`);let o=e.parentElement,s=d=>e.style.maxWidth=d+"px";e.style.maxWidth="";let r=o.clientWidth,i=o.clientHeight,a=r/2-.25,l=r+.5,u;if(r){for(;a+1<l;)u=Math.round((a+l)/2),s(u),o.clientHeight===i?l=u:a=u;s(l*n+r*(1-n))}e.__observer||(e.__observer=new ResizeObserver(()=>{self.__relayoutText(0,+e.dataset.brr,e)})).observe(o)}';

export function relayoutScriptCode() {
  return `self.__relayoutText=${staticRelayout}`;
}

export function RelayoutScript() {
  return (
    <script
      data-relayout=""
      dangerouslySetInnerHTML={{
        __html: relayoutScriptCode(),
      }}
    />
  );
}

/**
 * Initialize the relayout function for the client. You only need to call this, if you haven't added the `relayoutScript()` HTML to the `<head>`.
 */
export function initWrapBalancer() {
  if (!window.__relayoutText) window.__relayoutText = relayout;
}

interface BalancerProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The HTML tag to use for the wrapper element.
   * @default 'span'
   */
  as?: React.ElementType;
  /**
   * The balance ratio of the wrapper width (0 <= ratio <= 1).
   * 0 means the wrapper width is the same as the container width (no balance, browser default).
   * 1 means the wrapper width is the minimum (full balance, most compact).
   * @default 1
   */
  ratio?: number;
  children?: React.ReactNode;
}

export const Balancer: React.FC<BalancerProps> = ({
  as: Wrapper = "span",
  ratio = 0.75,
  children,
  ...props
}) => {
  const id = React.useId();
  const wrapperRef = React.useRef<
    HTMLElement & { __observer?: ResizeObserver }
  >();

  // Re-balance on content change and on mount/hydration.
  useIsomorphicLayoutEffect(() => {
    if (window.__relayoutText) {
      window.__relayoutText(0, ratio, wrapperRef.current);
    }
  }, [children, ratio]);

  // Remove the observer when unmounting.
  useIsomorphicLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    return () => {
      if (wrapper) {
        const resizeObserver = wrapper.__observer;
        if (resizeObserver) {
          resizeObserver.disconnect();
          delete wrapper.__observer;
        }
      }
    };
  }, []);

  if (process.env.NODE_ENV === "development") {
    // In development, we check `children`'s type to ensure we are not wrapping
    // elements like <p> or <h1> inside. Instead <Balancer> should directly
    // wrap text nodes.
    if (children && !Array.isArray(children) && typeof children === "object") {
      if (
        "type" in children &&
        typeof children.type === "string" &&
        children.type !== "span"
      ) {
        console.warn(
          `<Balancer> should not wrap <${children.type}> inside. Instead, it should directly wrap text or inline nodes.

Try changing this:
  <Balancer><${children.type}>content</${children.type}></Balancer>
To:
  <${children.type}><Balancer>content</Balancer></${children.type}>`
        );
      }
    }
  }

  return (
    <>
      <Wrapper
        {...props}
        data-br={id}
        data-brr={ratio}
        ref={wrapperRef}
        style={{
          display: "inline-block",
          verticalAlign: "top",
        }}
        suppressHydrationWarning
      >
        {children}
      </Wrapper>
      <script
        dangerouslySetInnerHTML={{
          // Calculate the balance initially for SSR
          __html: `window.__relayoutText("${id}",${ratio})`,
        }}
      />
    </>
  );
};
