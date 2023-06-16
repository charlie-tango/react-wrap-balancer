import React from "react";

const content = (
  <>
    <div
      className="skeleton"
      style={{
        // @ts-ignore
        "--w": "60%",
      }}
    />
    <div
      className="skeleton"
      style={{
        // @ts-ignore
        "--w": "80%",
      }}
    />
    <div
      className="skeleton"
      style={{
        // @ts-ignore
        "--w": "75%",
      }}
    />
  </>
);

export type ContentProps<T extends keyof JSX.IntrinsicElements = undefined> =
  (T extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[T] : never) & {
    as?: T;
    children?: React.ReactNode;
  };

export default function Content<T extends keyof JSX.IntrinsicElements>({
  as,
  children,
  ...props
}: ContentProps<T>) {
  if (as) {
    return React.createElement(as, props, children, content);
  }

  return (
    <React.Fragment {...props}>
      {children}
      {content}
    </React.Fragment>
  );
}
