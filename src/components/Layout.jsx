import React from 'react';

const Layout = ({ children }) => {
  return (
    <>
      <header>
        <h1>🛍️ EnterHere Blog</h1>
      </header>
      <main className="container">
        {children}
      </main>
      <footer>
        © {new Date().getFullYear()} EnterHere. All rights reserved.
      </footer>
    </>
  );
};

export default Layout;
