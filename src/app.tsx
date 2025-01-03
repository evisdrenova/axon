import { createRoot } from "react-dom/client";
import "./styles/index.css";
import Layout from "./layout";

const App = () => (
  <Layout>
    <h2 className="text-4xl bg-red-300">Welcome to Axon</h2>
  </Layout>
);

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find root element");
const root = createRoot(container);
root.render(<App />);
