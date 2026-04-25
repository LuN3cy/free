import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Generator from "./pages/Generator";
import History from "./pages/History";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}
