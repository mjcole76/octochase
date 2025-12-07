import "./App.css";
import { OctoSprint } from "./components/OctoSprint";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="pt-0">
        <Routes>
          <Route path="/" element={<OctoSprint />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
