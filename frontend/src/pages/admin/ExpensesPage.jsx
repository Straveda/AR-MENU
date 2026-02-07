import { useState } from "react";
import VendorsTab from "../../components/admin/expenses/VendorsTab";
import ExpensesTab from "../../components/admin/expenses/ExpensesTab";
import PettyCashTab from "../../components/admin/expenses/PettyCashTab";

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("vendors");

  const tabs = [
    { id: "vendors", label: "Vendors" },
    { id: "expenses", label: "Expenses" },
    { id: "petty-cash", label: "Petty Cash" },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      { }
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses & Petty Cash</h1>
          <p className="text-slate-500 mt-1">Track vendors, expenses, and petty cash</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl inline-flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      { }
      <div className="">
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "petty-cash" && <PettyCashTab />}
        {activeTab === "vendors" && <VendorsTab />}
      </div>
    </div>
  );
}
