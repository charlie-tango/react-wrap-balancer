import React from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const SYMBOL_KEY = "__relayoutText";
const SYMBOL_NATIVE_KEY = "__wrap_n";
const SYMBOL_OBSERVER_KEY = "__wrap_o";

interface WrapperElement extends HTMLElement {
  [SYMBOL_OBSERVER_KEY]?: ResizeObserver | undefined;
}

type RelayoutFn = (
  id: string | number,
  ratio: number,
  wrapper?: WrapperElement
) => void;

declare global {
  interface Window {
    [SYMBOL_KEY]: RelayoutFn;
    // A flag to indicate whether the browser supports text-balancing natively.
    // undefined: not injected
    // 1: injected and supported
    // 2: injected but not supported
    [SYMBOL_NATIVE_KEY]?: number;
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
    // Ensure we don't search widths lower than when the text overflows
    update(lower);
    lower = Math.max(wrapper.scrollWidth, lower);

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
  if (!wrapper["__wrap_o"] && typeof ResizeObserver !== "undefined") {
    (wrapper["__wrap_o"] = new ResizeObserver(() => {
      self.__relayoutText(0, +wrapper.dataset.brr, wrapper);
    })).observe(container);
  }
};

// Check for Text Wrap Balance support. Return '1' if supported, '2' if not.
const isTextWrapBalanceSupported = `(self.CSS&&CSS.supports("text-wrap","balance")?1:2)`;

export function relayoutScriptCode() {
  return `self.${SYMBOL_NATIVE_KEY}=self.${SYMBOL_NATIVE_KEY}||${isTextWrapBalanceSupported};self.${SYMBOL_KEY}=${relayout.toString()}`;
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
  if (!window[SYMBOL_KEY]) window[SYMBOL_KEY] = relayout;
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
    HTMLElement & { [SYMBOL_OBSERVER_KEY]?: ResizeObserver }
  >();

  // Re-balance on content change and on mount/hydration.
  useIsomorphicLayoutEffect(() => {
    if (self[SYMBOL_NATIVE_KEY] === 1) return;
    if (window[SYMBOL_KEY]) {
      window[SYMBOL_KEY](0, ratio, wrapperRef.current);
    }
  }, [children, ratio]);

  // Remove the observer when unmounting.
  useIsomorphicLayoutEffect(() => {
    if (self[SYMBOL_NATIVE_KEY] === 1) return;

    const wrapper = wrapperRef.current;
    return () => {
      if (wrapper) {
        const resizeObserver = wrapper[SYMBOL_OBSERVER_KEY];
        if (resizeObserver) {
          resizeObserver.disconnect();
          delete wrapper[SYMBOL_OBSERVER_KEY];
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
          textWrap: "balance",
        }}
        suppressHydrationWarning
      >
        {children}
      </Wrapper>
      <script
        dangerouslySetInnerHTML={{
          // Calculate the balance initially for SSR
          __html: `window.${SYMBOL_KEY}("${id}",${ratio})`,
        }}
      />
    </>
  );
};
