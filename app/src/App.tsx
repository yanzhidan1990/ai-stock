import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Rules from "@/pages/Rules";
import Review from "@/pages/Review";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/review" element={<Review />} />
      </Routes>
    </Router>
  );
}
