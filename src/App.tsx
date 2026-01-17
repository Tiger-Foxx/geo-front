import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Geoportal } from './pages/Geoportal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/geoportal" element={<Geoportal />} />
      </Routes>
    </Router>
  );
}

export default App;
