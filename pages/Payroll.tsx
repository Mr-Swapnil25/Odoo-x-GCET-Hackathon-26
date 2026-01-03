import React from 'react';
import { useStore } from '../store';
import { Role } from '../types';
import { Card, CardContent, Badge, Button, cn, useRoleTheme } from '../components/UI';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export const Payroll = () => {
  const { employees, currentUser } = useStore();
  const theme = useRoleTheme();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === Role.ADMIN;

  const handleExport = () => {
      toast.success("Payroll report downloaded successfully ");
  };

  // EMPLOYEE VIEW
  if (currentUser.role !== Role.ADMIN) {
    const employee = employees.find(e => e.id === currentUser.id);
    if (!employee) return <div className="text-white">Employee not found</div>;
    const { salary } = employee;

    return (
        <div className="relative space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">My Payslip</h1>
                <Button onClick={handleExport} variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
            </div>

            <Card className={cn(
                "backdrop-blur-md shadow-xl border-t-4",
                isAdmin 
                  ? "bg-slate-800/60 border-slate-700 border-t-blue-500"
                  : "bg-[#1e1835]/60 border-[#2d2249] border-t-[#6e3df5]"
            )}>
                <CardContent className="p-8">
                    <div className={cn(
                        "flex justify-between items-start border-b pb-6 mb-6",
                        isAdmin ? "border-slate-700" : "border-[#2d2249]"
                    )}>
                        <div>
                            <h2 className="text-xl font-bold text-white">Dayflow Inc.</h2>
                            <p className={cn("text-sm", theme.isAdmin ? "text-slate-400" : "text-[#a090cb]")}>Payslip for {format(new Date(), 'MMMM yyyy')}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-white">{employee.firstName} {employee.lastName}</h3>
                            <p className={cn("text-sm", theme.isAdmin ? "text-slate-400" : "text-[#a090cb]")}>{employee.designation}</p>
                            <p className={cn("text-xs font-mono mt-1", theme.isAdmin ? "text-slate-500" : "text-[#a090cb]/70")}>{employee.id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" /> Earnings
                            </h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-[#2d2249]">
                                    <span className="text-[#a090cb]">Basic Salary</span>
                                    <span className="font-medium text-white">₹{salary.basic.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-[#2d2249]">
                                    <span className="text-[#a090cb]">House Rent Allowance</span>
                                    <span className="font-medium text-white">₹{salary.hra.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-[#2d2249]">
                                    <span className="text-[#a090cb]">Special Allowances</span>
                                    <span className="font-medium text-white">₹{salary.allowances.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 pt-4 font-bold text-white">
                                    <span>Gross Earnings</span>
                                    <span>₹{(salary.basic + salary.hra + salary.allowances).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-red-400" /> Deductions
                            </h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-[#2d2249]">
                                    <span className="text-[#a090cb]">Provident Fund</span>
                                    <span className="font-medium text-red-400">-₹{(salary.deductions * 0.6).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-[#2d2249]">
                                    <span className="text-[#a090cb]">Professional Tax</span>
                                    <span className="font-medium text-red-400">-₹{(salary.deductions * 0.4).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between py-2 pt-4 font-bold text-white">
                                    <span>Total Deductions</span>
                                    <span className="text-red-400">-₹{salary.deductions.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-gradient-to-r from-[#6e3df5]/20 to-[#5b32cc]/20 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-[#6e3df5]/30">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-[#6e3df5]/30 rounded-full text-[#6e3df5]">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Net Salary Payable</p>
                                <p className="text-xs text-[#a090cb]">Transferred to Bank Account ending ****4532</p>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-[#6e3df5]">
                            ₹{salary.netSalary.toLocaleString()}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  // ADMIN VIEW
  const totalPayroll = employees.reduce((acc, curr) => acc + curr.salary.netSalary, 0);

  return (
    <div className="relative space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Payroll Management</h1>
        <Button onClick={handleExport} variant="outline" className="border-[#2d2249] text-[#a090cb] hover:bg-[#2d2249] hover:text-white">
            <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-[#6e3df5] to-[#5b32cc] text-white border-none shadow-xl shadow-[#6e3df5]/20">
              <CardContent className="p-6">
                  <p className="text-white/70 text-sm font-medium">Total Monthly Payroll</p>
                  <h2 className="text-3xl font-bold mt-2">₹{totalPayroll.toLocaleString()}</h2>
              </CardContent>
          </Card>
           <Card className="bg-[#1e1835]/60 backdrop-blur-md border border-[#2d2249] shadow-xl">
              <CardContent className="p-6">
                  <p className="text-[#a090cb] text-sm font-medium">Average Salary</p>
                  <h2 className="text-3xl font-bold mt-2 text-white">₹{Math.round(totalPayroll / employees.length).toLocaleString()}</h2>
              </CardContent>
          </Card>
           <Card className="bg-[#1e1835]/60 backdrop-blur-md border border-[#2d2249] shadow-xl">
              <CardContent className="p-6">
                  <p className="text-[#a090cb] text-sm font-medium">Payroll Date</p>
                  <h2 className="text-3xl font-bold mt-2 text-white">30th</h2>
                  <p className="text-xs text-emerald-400 mt-1">Upcoming in 4 days</p>
              </CardContent>
          </Card>
      </div>

      <Card className="bg-[#1e1835]/60 backdrop-blur-md border border-[#2d2249] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-[#2d2249]/50 text-[#a090cb] uppercase">
                      <tr>
                          <th className="p-4">Employee ID</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Department</th>
                          <th className="p-4">Basic</th>
                          <th className="p-4">Allowances</th>
                          <th className="p-4">Deductions</th>
                          <th className="p-4">Net Salary</th>
                          <th className="p-4">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d2249]">
                      {employees.map(emp => (
                          <tr key={emp.id} className="hover:bg-[#2d2249]/30 transition-colors">
                              <td className="p-4 font-mono text-[#a090cb]">{emp.id}</td>
                              <td className="p-4 font-medium text-white">{emp.firstName} {emp.lastName}</td>
                              <td className="p-4"><Badge variant="outline" className="border-[#6e3df5]/50 text-[#a090cb]">{emp.department}</Badge></td>
                              <td className="p-4 text-white">₹{emp.salary.basic.toLocaleString()}</td>
                              <td className="p-4 text-white">₹{emp.salary.allowances.toLocaleString()}</td>
                              <td className="p-4 text-red-400">-₹{emp.salary.deductions.toLocaleString()}</td>
                              <td className="p-4 font-bold text-white">₹{emp.salary.netSalary.toLocaleString()}</td>
                              <td className="p-4"><Badge variant="success" className="bg-emerald-900/50 text-emerald-300 border-emerald-700/50">Processed</Badge></td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </Card>
    </div>
  );
};
