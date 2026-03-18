import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import History from "./pages/History";
import Home from "./pages/Home";
import Report from "./pages/Report";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="min-h-screen bg-gray-50"><Header /><Home /></div>} />
        <Route path="/history" element={<div className="min-h-screen bg-gray-50"><Header /><History /></div>} />
        <Route path="/report/:reportId" element={<Report />} />
      </Routes>
    </BrowserRouter>
  );
}
