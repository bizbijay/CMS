import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toaster";

export function useUnauthorizedHandler() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    function handle() {
      addToast("Your session has expired. Please log in again.", "error");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    }

    window.addEventListener("cms:unauthorized", handle);
    return () => window.removeEventListener("cms:unauthorized", handle);
  }, [addToast, navigate]);
}
