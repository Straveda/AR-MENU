import { useState } from "react";
import VendorsTab from "../../components/admin/expenses/VendorsTab";
import ExpensesTab from "../../components/admin/expenses/ExpensesTab";
import PettyCashTab from "../../components/admin/expenses/PettyCashTab";

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("expenses");

  const tabs = [
    { id: "expenses", label: "Expenses", icon: "💰" },
    { id: "petty-cash", label: "Petty Cash", icon: "🪙" },
    { id: "vendors", label: "Vendors", icon: "🤝" },
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="type-h1">Financial Oversight</h1>
          <p className="type-secondary mt-1">Track operational expenses and manage vendor relationships</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-8 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 type-label transition-all relative ${
              activeTab === tab.id 
                ? "text-slate-900" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-full"></span>}
          </button>
        ))}
      </div>

      {}
      <div className="mt-6">
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "petty-cash" && <PettyCashTab />}
        {activeTab === "vendors" && <VendorsTab />}
      </div>
    </div>
  );
}
