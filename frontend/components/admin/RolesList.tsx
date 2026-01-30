'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { USER_ROLES } from '@/lib/roles';
import { Shield, Check } from 'lucide-react';

export default function RolesList() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(USER_ROLES).map(([key, role]) => (
          <Card key={key} className="hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                  {role.name}
                </span>
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 min-h-[40px]">{role.description}</p>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3">Capabilities</h4>
              <ul className="space-y-2">
                {role.capabilities.map((capability, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{capability}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-50 dark:bg-slate-900 border-none">
        <CardHeader>
          <CardTitle className="text-lg">Role Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-slate-500 text-sm mb-4">
              Each role inherits capabilities from the roles below it:
            </p>
            <div className="flex flex-col gap-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Super Admin</span>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Highest Level</span>
              </div>
              <div className="flex items-center gap-3 ml-6">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Administrator</span>
              </div>
              <div className="flex items-center gap-3 ml-12">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Editor</span>
              </div>
              <div className="flex items-center gap-3 ml-[4.5rem]">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-semibold text-slate-600 dark:text-slate-400">Author</span>
              </div>
              <div className="flex items-center gap-3 ml-[6rem]">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="font-semibold text-slate-600 dark:text-slate-400">Contributor</span>
              </div>
              <div className="flex items-center gap-3 ml-[7.5rem]">
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span className="font-semibold text-slate-500 dark:text-slate-500">Subscriber</span>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Lowest Level</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
