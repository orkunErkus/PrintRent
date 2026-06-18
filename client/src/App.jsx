import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PrinterDetail from './pages/PrinterDetail';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/printers/:id" element={<PrinterDetail />} />
      </Routes>
    </Layout>
  );
}
