import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import History from "./pages/History";
import Home from "./pages/Home";
import Report from "./pages/Report";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/report/:reportId" element={<Report />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
