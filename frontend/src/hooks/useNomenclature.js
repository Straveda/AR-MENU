import { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

export function useNomenclature() {
  const [nomenclature, setNomenclature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNomenclature = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get("/config/nomenclature");
        if (res.data.success) {
          setNomenclature(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch nomenclature:", err);
        setError(err);
        
        setNomenclature({
          SYSTEM_ROLES: {
            SUPER_ADMIN: "Super Admin",
            PLATFORM_ADMIN: "Platform Admin",
            RESTAURANT_ADMIN: "Restaurant Admin",
            CUSTOMER: "Customer"
          },
          DEPARTMENTS: {
            KDS: "Kitchen Display",
            Finance: "Finance",
            Operations: "Operations"
          },
          LABELS: {
            staff: "Staff",
            staffMember: "Staff Member",
            department: "Department",
            role: "Role",
            roleTitle: "Role Title"
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNomenclature();
  }, []);

  return { nomenclature, loading, error };
}
