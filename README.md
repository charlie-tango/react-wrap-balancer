## Introduction

This is a fork of [react-wrap-balancer](https://github.com/shuding/react-wrap-balancer), that focuses on integrating it into micro-frontend React SSR applications.
The original implementations, works great for Next.js applications - But if we have multiply instances of React, then the `<Provider>` pattern isn't ideal.

This fork, uses a different approach, where a `<RelayoutScript>` element is used to inject the `<script>` tag in `<head>`, so the `<Provider>` is no longer needed.

If

## Usage

To start using the library, install it to your project:

```bash
npm i @charlietango/react-wrap-balancer
```

Inject the `relayoutScript()` function in your HTML template:

```tsx
const html = () => (
  <html>
    <head>
      <title>App</title>
      <RelayoutScript />
    </head>
    <body>
      <div id="root" />
    </body>
  </html>
);
```

And wrap text content with the `<Balancer>` component:

```jsx
import { Balancer } from "@charlietango/react-wrap-balancer";

function Title() {
  return (
    <h1>
      <Balancer>My Awesome Title</Balancer>
    </h1>
  );
}
```

### Client-side only

To make it work with Storybook or tests, you can initialize the relayout function
only on the client-side. This needs happen before you initialize the React components.

```jsx
import { initWrapBalancer } from "@charlietango/react-wrap-balancer";

initWrapBalancer();
```
