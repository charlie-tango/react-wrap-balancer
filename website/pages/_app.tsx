import "../src/style.css";
import Head from 'next/head'
import React from "react";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>React Wrap Balancer</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
