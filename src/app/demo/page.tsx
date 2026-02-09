'use client';

import React, { useState } from 'react';
import { NeumorphicCard, NeumorphicInset } from '@/components/ui/PremiumCards';

export default function NeumorphicDemo() {
    const [activeView, setActiveView] = useState('HOME');
    const [chartTab, setChartTab] = useState('WEEK');
    const [coolingActive, setCoolingActive] = useState(true);

    // Weekly temperature data for chart
    const weeklyData = [18, 17, 16, 16.5, 17.5, 18, 17];
    const maxTemp = Math.max(...weeklyData);
    const minTemp = Math.min(...weeklyData);

    return (
        <div className="min-h-screen bg-background font-inter text-foreground flex flex-col items-center p-5 pb-32 transition-all duration-700">

            {/* Bento Navigation Bar - Square Buttons */}
            <div className="w-full max-w-md flex gap-4 justify-center mb-10 mt-10">
                <button
                    onClick={() => setActiveView('HOME')}
                    className={`w-16 h-16 rounded-2xl transition-all duration-300 flex items-center justify-center ${activeView === 'HOME'
                            ? 'neumorphic-inset text-primary'
                            : 'neumorphic text-deep-text/20'
                        }`}
                >
                    <i className={`bi bi-house-door${activeView === 'HOME' ? '-fill' : ''} text-2xl`}></i>
                </button>

                <button
                    onClick={() => setActiveView('AGENT')}
                    className={`w-16 h-16 rounded-2xl transition-all duration-300 flex items-center justify-center ${activeView === 'AGENT'
                            ? 'neumorphic-inset text-brand-blue'
                            : 'neumorphic text-deep-text/20'
                        }`}
                >
                    <i className={`bi bi-shield-lock${activeView === 'AGENT' ? '-fill' : ''} text-2xl`}></i>
                </button>
            </div>

            {/* Content Area */}
            <div className="w-full max-w-md relative min-h-[600px]">

                {activeView === 'HOME' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                        {/* My Home Card - Sharp Bento */}
                        <div className="neumorphic rounded-3xl p-8 flex flex-col gap-6 border border-white/20">

                            {/* Header with back button */}
                            <div className="flex items-center gap-4 mb-2">
                                <button className="w-10 h-10 rounded-xl neumorphic text-deep-text/40 flex items-center justify-center">
                                    <i className="bi bi-arrow-left text-lg"></i>
                                </button>
                                <div className="flex flex-col">
                                    <span className="text-xs text-deep-text/50 font-normal">Hello!</span>
                                    <h1 className="text-2xl font-bold tracking-tight text-deep-text">My Home</h1>
                                </div>
                            </div>

                            {/* Control Icons - Square Bento Tiles */}
                            <div className="flex gap-2 justify-between px-2">
                                <button className="w-12 h-12 rounded-xl neumorphic-inset text-brand-blue flex items-center justify-center">
                                    <i className="bi bi-tv text-lg"></i>
                                </button>
                                <button className="w-12 h-12 rounded-xl neumorphic text-deep-text/10 flex items-center justify-center">
                                    <i className="bi bi-lightbulb text-lg"></i>
                                </button>
                                <button className="w-12 h-12 rounded-xl neumorphic-inset text-brand-blue flex items-center justify-center">
                                    <i className="bi bi-wifi text-lg"></i>
                                </button>
                                <button className="w-12 h-12 rounded-xl neumorphic text-deep-text/10 flex items-center justify-center">
                                    <i className="bi bi-snow text-lg"></i>
                                </button>
                                <button className="w-12 h-12 rounded-xl neumorphic text-deep-text/20 flex items-center justify-center">
                                    <i className="bi bi-plus-lg text-lg"></i>
                                </button>
                            </div>

                            {/* Temperature Dial - In Square Container */}
                            <div className="flex justify-center py-4">
                                <div className="neumorphic w-52 h-52 rounded-3xl flex items-center justify-center relative">
                                    <div className="neumorphic-inset w-40 h-40 rounded-full flex flex-col items-center justify-center">
                                        <span className="text-[4rem] font-bold leading-none text-deep-text tracking-tighter">16<span className="text-2xl">°C</span></span>
                                        <div className="flex items-center gap-1.5 mt-3">
                                            <i className="bi bi-snow text-brand-blue text-xs"></i>
                                            <span className="text-[10px] font-medium text-deep-text/50">Cooling</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Humidity & Internet - Bento Cards */}
                            <div className="flex flex-col gap-4">
                                <NeumorphicCard className="flex items-center gap-5 py-5 px-6 rounded-2xl border border-white/20" isBtn={false}>
                                    <div className="w-12 h-12 rounded-xl neumorphic-inset flex items-center justify-center text-brand-blue">
                                        <i className="bi bi-droplet-fill text-xl"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-deep-text/50">Humidity</span>
                                        <span className="text-2xl font-bold tracking-tight text-deep-text">65%</span>
                                    </div>
                                </NeumorphicCard>

                                <NeumorphicCard className="flex items-center gap-5 py-5 px-6 rounded-2xl border border-white/20" isBtn={false}>
                                    <div className="w-12 h-12 rounded-xl neumorphic-inset flex items-center justify-center text-deep-text/40">
                                        <i className="bi bi-wifi text-xl"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-deep-text/50">Internet</span>
                                        <span className="text-2xl font-bold tracking-tight text-deep-text/50">20 mbps</span>
                                    </div>
                                </NeumorphicCard>
                            </div>

                            {/* Bottom Control with Toggle */}
                            <div className="flex justify-between items-center pt-4 border-t border-deep-text/5 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-normal text-deep-text/40">Current temperature</span>
                                    <span className="text-lg font-bold text-deep-text">18.5°C</span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-normal text-deep-text/40">Turn On/Off</span>
                                    <button
                                        onClick={() => setCoolingActive(!coolingActive)}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 neumorphic-inset p-1 ${coolingActive ? 'bg-brand-blue/10' : ''}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-deep-text/20 transition-all ${coolingActive ? 'translate-x-6 bg-brand-blue' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                        {/* Wesley Lee Dashboard - Bento Grid */}
                        <div className="neumorphic rounded-3xl p-8 flex flex-col gap-6 border border-white/20">

                            {/* Header with greeting */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-deep-text/50 font-normal">Good Morning</span>
                                    <h2 className="text-2xl font-bold text-deep-text">Wesley Lee</h2>
                                </div>
                                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                                    <img src="https://i.pravatar.cc/100?u=wesley2" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Top Metric Cards - Bento Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <NeumorphicCard className="flex flex-col gap-2 py-5 px-4 items-center rounded-2xl border border-white/20" isBtn={false}>
                                    <i className="bi bi-thermometer-half text-2xl text-brand-blue mb-1"></i>
                                    <span className="text-[9px] font-medium text-deep-text/40">Temperature</span>
                                    <span className="text-xl font-bold text-deep-text leading-none">18.5°C</span>
                                    <span className="text-[8px] font-normal text-deep-text/30">Now</span>
                                </NeumorphicCard>

                                <NeumorphicCard className="flex flex-col gap-2 py-5 px-4 items-center rounded-2xl border border-white/20" isBtn={false}>
                                    <i className="bi bi-lightning-fill text-2xl text-primary mb-1"></i>
                                    <span className="text-[9px] font-medium text-deep-text/40">Electricity</span>
                                    <span className="text-xl font-bold text-deep-text leading-none">265</span>
                                    <span className="text-[8px] font-normal text-deep-text/30">Yesterday</span>
                                </NeumorphicCard>

                                <NeumorphicCard className="flex flex-col gap-2 py-5 px-4 items-center rounded-2xl border border-white/20" isBtn={false}>
                                    <i className="bi bi-droplet-fill text-2xl text-brand-blue mb-1"></i>
                                    <span className="text-[9px] font-medium text-deep-text/40">Humidity</span>
                                    <span className="text-xl font-bold text-deep-text leading-none">26%</span>
                                    <span className="text-[8px] font-normal text-deep-text/30">Today</span>
                                </NeumorphicCard>
                            </div>

                            {/* Temperature Analysis */}
                            <div className="flex flex-col gap-4 mt-4">
                                <h3 className="text-base font-bold text-deep-text">
                                    Temperature <span className="font-normal text-deep-text/40">analysis</span>
                                </h3>

                                {/* Chart Tabs */}
                                <div className="flex gap-2">
                                    {['Today', 'Week', 'Month'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setChartTab(tab.toUpperCase())}
                                            className={`text-xs font-medium py-2 px-4 rounded-xl transition-all ${chartTab === tab.toUpperCase()
                                                    ? 'text-brand-blue'
                                                    : 'text-deep-text/30'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Temperature Chart - Bento Box */}
                                <NeumorphicCard className="p-6 rounded-2xl border border-white/20" isBtn={false}>
                                    {/* Current temp indicator */}
                                    <div className="text-right mb-4">
                                        <span className="text-2xl font-bold text-[#FF8C42]">16.5°C</span>
                                    </div>

                                    {/* Chart SVG */}
                                    <div className="relative h-32 mb-4">
                                        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                                            {/* Generate path from data */}
                                            <path
                                                d={weeklyData.map((temp, i) => {
                                                    const x = (i / (weeklyData.length - 1)) * 300;
                                                    const y = 100 - ((temp - minTemp) / (maxTemp - minTemp)) * 80;
                                                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                                }).join(' ')}
                                                fill="none"
                                                stroke="#FF8C42"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            {/* Data points */}
                                            {weeklyData.map((temp, i) => {
                                                const x = (i / (weeklyData.length - 1)) * 300;
                                                const y = 100 - ((temp - minTemp) / (maxTemp - minTemp)) * 80;
                                                return (
                                                    <circle
                                                        key={i}
                                                        cx={x}
                                                        cy={y}
                                                        r={i === 3 ? "6" : "4"}
                                                        fill={i === 3 ? "#FF8C42" : "#FF8C42"}
                                                        opacity={i === 3 ? "1" : "0.6"}
                                                    />
                                                );
                                            })}
                                        </svg>
                                    </div>

                                    {/* Day labels */}
                                    <div className="flex justify-between px-1 text-[10px] font-medium text-deep-text/30">
                                        {['S', 'M', 'S', 'T', 'W', 'T', 'F'].map((day, i) => (
                                            <span key={i} className={i === 3 ? 'text-[#FF8C42]' : ''}>{day}</span>
                                        ))}
                                    </div>
                                </NeumorphicCard>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <p className="mt-12 text-[10px] font-bold uppercase tracking-[0.6em] text-deep-text/10 text-center">
                Bento UI v1.0
            </p>
        </div>
    );
}
