import Login from "../components/Login";
import Register from "../components/Register";
import { useState } from "react";

function Auth() {
  const [WantLogin, setWantLogin] = useState(true);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        {WantLogin ? <Login setWantLogin={setWantLogin} /> : <Register setWantLogin={setWantLogin}/>}
      </div>
    </div>
  );
}

export default Auth;
