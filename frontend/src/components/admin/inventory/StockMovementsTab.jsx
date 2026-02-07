import EmptyState from "../../common/EmptyState";

export default function StockMovementsTab({ movements }) {
    if (movements.length === 0) {
        return <EmptyState title="No movements tracked" message="Ingredient stock changes will appear here." icon="🔄" />;
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4">Ingredient</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">Quantity</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">User</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-sm text-slate-700">
                        {movements.map((m) => (
                            <tr key={m._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-bold text-slate-700">{new Date(m.createdAt).toLocaleDateString()}</span>
                                    <span className="text-xs text-slate-400 block">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-medium text-slate-900">{m.ingredientId?.name || 'Deleted Ingredient'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${m.action === 'ADD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                            {m.action === 'ADD' ? 'Stock In' : 'Stock Out'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`font-bold ${m.action === 'ADD' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {m.action === 'ADD' ? '+' : '-'}{m.quantity}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-1.5">{m.ingredientId?.unit}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-block py-1 px-2 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">{m.reason}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs">
                                    {/* Placeholder for User if not in movement, assuming logged in user or need expansion */}
                                    Admin
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
