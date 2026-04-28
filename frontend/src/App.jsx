import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SetupPage from './pages/SetupPage'
import NewSetup from './pages/NewSetup'
import EditSetup from './pages/EditSetup'
import './styles/global.css'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/setup/:id" element={<SetupPage />} />
          <Route path="/new"       element={<NewSetup />} />
          <Route path="/edit/:id"  element={<EditSetup />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
