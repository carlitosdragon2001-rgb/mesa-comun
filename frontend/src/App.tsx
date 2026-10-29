import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./AppLayout";
import Landing from "./pages/Landing";
import Inicio from "./pages/Inicio";
import Organizaciones from "./pages/Organizaciones";
import AbrirOrganizacion from "./pages/AbrirOrganizacion";
import NuevaOrganizacion from "./pages/NuevaOrganizacion";
import Escanear from "./pages/Escanear";
import Perfiles from "./pages/Perfiles";
import MenuSemanal from "./pages/MenuSemanal";
import ListaCompra from "./pages/ListaCompra";
import Seguimiento from "./pages/Seguimiento";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="inicio" replace />} />
        <Route path="inicio" element={<Inicio />} />
        <Route path="nueva" element={<NuevaOrganizacion />} />
        <Route path="escanear" element={<Escanear />} />
        <Route path="organizaciones" element={<Organizaciones />} />
        <Route path="organizaciones/:orgId" element={<AbrirOrganizacion />} />
        <Route path="perfiles" element={<Perfiles />} />
        <Route path="perfiles/:perfilId" element={<Perfiles />} />
        <Route path="menu" element={<MenuSemanal />} />
        <Route path="compra" element={<ListaCompra />} />
        <Route path="seguimiento" element={<Seguimiento />} />
      </Route>
    </Routes>
  );
}

export default App;
