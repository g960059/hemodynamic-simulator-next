'use client'

import Layout from "../../src/components/layout";
import Footer from "../../src/components/Footer";

const CommonLayout = ({ children }) => {
  return (
    <Layout>
      {children}
      <hr className="border-0 border-b border-slate-200"/>
      <Footer/>
    </Layout>
  );
}

export default CommonLayout;