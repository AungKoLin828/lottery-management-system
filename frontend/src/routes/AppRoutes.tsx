import {
Routes,
Route
} from "react-router-dom";


// import Home from "../pages/public/Home";
// import Login from "../pages/auth/Login";

// import AdminDashboard from "../pages/admin/Dashboard";


export default function AppRoutes(){

return (

<Routes>

<Route 
path="/" 
element={<Home/>}
/>


<Route 
path="/login" 
element={<Login/>}
/>


<Route
path="/admin"
element={<AdminDashboard/>}
/>

</Routes>

)

}