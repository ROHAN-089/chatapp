import { Routes , Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import { useAuthStore } from "./store/useAuthStore.js";
import { useThemeStore } from "./store/useThemeStore.js"; 
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar.jsx";

function App() {
  const { authUser , checkAuth , isCheckingAuth , onlineUsers } = useAuthStore();
  useEffect(() => {
    checkAuth();
  }
  , []);

  console.log(onlineUsers);
  

  const { theme, setTheme } = useThemeStore();
  useEffect(() => {
    // Ensure the stored theme is applied to the document on load
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);


   if (isCheckingAuth && !authUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-dots loading-xl"></span>
      </div>
    );
   } 


  return (
    <div>
      <Navbar data-theme={theme} />
      <Routes>
        <Route path="/" element={ authUser? <HomePage/> : <Navigate to='/login/' />} />
        <Route path="/signup" element={!authUser ? <SignUpPage />: <Navigate to='/' /> }/>
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to='/' />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to='/login/' />} />
      </Routes>

      < Toaster />
    </div>
  );
}

export default App;
