import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, UserPlus, Search, Stethoscope, 
    FileText, Settings, LogOut, Bed 
} from 'lucide-react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    
    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'User1', 'User2/User3'] },
        { name: 'Register Patient', path: '/register', icon: UserPlus, roles: ['Admin', 'User1', 'User2/User3'] },
        { name: 'Patient Search/Edit', path: '/search', icon: Search, roles: ['Admin', 'User1', 'User2/User3'] },
        { name: 'Investigations', path: '/investigations', icon: Stethoscope, roles: ['Admin', 'User2/User3'] },
        { name: 'Inpatients', path: '/inpatients', icon: Bed, roles: ['Admin', 'User1', 'User2/User3'] },
        { name: 'Daily Report', path: '/reports', icon: FileText, roles: ['Admin', 'User1', 'User2/User3'] },
        { name: 'Masters', path: '/masters', icon: Settings, roles: ['Admin'] },
    ];

    return (
        <div className="flex flex-col w-72 bg-secondary-900 border-r border-gray-800 text-white min-h-screen relative overflow-hidden no-print">
            {/* Ambient glow effect inside sidebar */}
            <div className="absolute top-0 left-0 w-full h-80 bg-primary-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 pointer-events-none"></div>
            
            <div className="p-8 font-black text-3xl tracking-widest text-center border-b border-white/10 z-10">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-200">Vanamala</span>
                <div className="text-sm text-gray-400 font-medium tracking-widest mt-1">CLINIC</div>
            </div>
            
            <div className="px-6 py-5 border-b border-white/5 z-10 backdrop-blur-md bg-white/5 mx-5 mt-6 rounded-2xl shadow-inner border">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Welcome back,</div>
                <div className="font-bold capitalize text-xl mt-1 text-white">{user?.username}</div>
                <div className="text-[10px] uppercase tracking-widest bg-gradient-to-r from-primary-500 to-primary-700 text-white px-3 py-1 rounded-full w-max mt-3 shadow-lg">{user?.role}</div>
            </div>

            <nav className="flex-1 px-5 py-8 space-y-2 z-10">
                {navItems.filter(item => item.roles.includes(user?.role)).map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 group
                            ${isActive 
                                ? 'bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-lg shadow-primary-900/50 translate-x-1 border border-primary-500/30' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1 border border-transparent'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={22} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-300 transition-colors'} />
                                <span className="font-medium tracking-wide">{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-5 border-t border-white/10 z-10">
                <button 
                    onClick={logout}
                    className="flex items-center justify-center space-x-3 px-4 py-4 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20"
                >
                    <LogOut size={20} />
                    <span className="font-bold tracking-wide">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
