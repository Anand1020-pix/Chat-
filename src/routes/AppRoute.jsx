import {  Route, Routes} from "react-router-dom";
import MainLayout from "../layout/MainLayout.jsx";


const AppRoute = () => {
  return (
    <Routes>
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}


export default AppRoute;