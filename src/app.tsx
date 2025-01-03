import { createRoot } from "react-dom/client";
import "./styles/index.css";
import Layout from "./layout";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Servers from "./pages/Servers";
import Home from "./pages/Home";
import Providers from "./pages/Providers";

const App = () => (
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/servers" element={<Servers />} />
        <Route path="/providers" element={<Providers />} />
      </Routes>
    </Layout>
  </BrowserRouter>
);

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find root element");
const root = createRoot(container);
root.render(<App />);
