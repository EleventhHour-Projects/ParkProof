// // components/admin/StatsCards.tsx
// import {AdminDashboardStats} from "@/lib/types/adminDashboardStats"

// export default function StatsCards({ stats }: { stats: AdminDashboardStats }) {
//   return (
//     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
//           {/* Revenue Card */}
//           <div className="bg-white border border-gray-100 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
//             <div className="text-xs font-light text-gray-500 mb-2 tracking-wide">
//               Revenue This Month
//             </div>
//             <div className="flex items-baseline gap-2 mb-1">
//               <span className="text-xs text-gray-600">₹</span>
//               <span className="text-2xl sm:text-3xl font-light text-gray-900">
//                 {stats?.revenueThisMonth || '7Cr'}
//               </span>
//             </div>
//             <div className="text-xs text-green-600 font-light">
//               {stats?.revenueGrowth || '+ 4.2%'}
//             </div>
//           </div>

//           {/* Total Parking Lots Card */}
//           <div className="bg-white border border-gray-100 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
//             <div className="text-xs font-light text-gray-500 mb-2 tracking-wide">
//               Total Parking Lots
//             </div>
//             <div className="text-2xl sm:text-3xl font-light text-gray-900 mb-1">
//               {stats?.totalLots || '150'}
//             </div>
//             <div className="text-xs text-green-600 font-light">
//               {stats?.lotsAdded || '+2 This Week'}
//             </div>
//           </div>

//           {/* Occupied Slots Card */}
//           <div className="bg-white border border-gray-100 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
//             <div className="text-xs font-light text-gray-500 mb-2 tracking-wide">
//               Occupied Slots
//             </div>
//             <div className="text-2xl sm:text-3xl font-light text-gray-900">
//               {stats?.occupiedSlots || '4535'}
//             </div>
//           </div>

//           {/* Available Slots Card */}
//           <div className="bg-white border border-gray-100 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
//             <div className="text-xs font-light text-gray-500 mb-2 tracking-wide">
//               Available Slots
//             </div>
//             <div className="text-2xl sm:text-3xl font-light text-green-600">
//               {stats?.availableSlots || '6532'}
//             </div>
//           </div>
//         </div>
//   );
// }
// components/admin/StatsCards.tsx
import {AdminDashboardStats} from "@/lib/types/adminDashboardStats"

export default function StatsCards({ stats }: { stats: AdminDashboardStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
          {/* Revenue Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg">
            <div className="text-sm text-gray-600 mb-3 font-medium">
              Revenue This month
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-4xl">💵</span>
              <span className="text-3xl font-bold text-gray-900">
                {stats?.revenueThisMonth || '₹7Cr'}
              </span>
            </div>
            <div className="text-sm text-green-500 font-medium">
              {stats?.revenueGrowth || '+ 4.2%'}
            </div>
          </div>

          {/* Total Parking Lots Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg">
            <div className="text-sm text-gray-600 mb-3 font-medium">
              Total Parking Lots
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-4xl">🅿️</span>
              <span className="text-3xl font-bold text-gray-900">
                {stats?.totalLots || '150'}
              </span>
            </div>
            <div className="text-sm text-green-500 font-medium">
              {stats?.lotsAdded || '+2 This Week'}
            </div>
          </div>

          {/* Occupied Slots Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg">
            <div className="text-sm text-gray-600 mb-3 font-medium">
              Occupied Slots
            </div>
            <div className="flex items-center gap-2">
              <span className="text-4xl">🚗</span>
              <span className="text-3xl font-bold text-gray-900">
                {stats?.occupiedSlots || '4535'}
              </span>
            </div>
          </div>

          {/* Available Slots Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg">
            <div className="text-sm text-gray-600 mb-3 font-medium">
              Available Slots
            </div>
            <div className="flex items-center gap-2">
              <span className="text-4xl">✅</span>
              <span className="text-3xl font-bold text-green-600">
                {stats?.availableSlots || '6969'}
              </span>
            </div>
          </div>
        </div>
  );
}