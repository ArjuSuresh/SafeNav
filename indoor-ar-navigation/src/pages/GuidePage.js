import React, { useState } from 'react';
import {
    Smartphone, Home, Camera, ScanSearch, MapPin,
    Compass, Map, RefreshCw, ShieldAlert,
    Lightbulb, MonitorSmartphone, Sun, BatteryCharging, Volume2,
} from 'lucide-react';
import './GuidePage.css';

const steps = [
    {
        icon: Smartphone,
        title: 'Open on Mobile',
        desc: 'Scan the QR code or open the website link on your Android/iOS phone browser (Chrome recommended). The site is optimized for mobile.',
    },
    {
        icon: Home,
        title: 'Start from Home',
        desc: 'You\'ll land on the Home page. Tap "Navigate" from the navbar or the "Start Navigation" button to begin.',
    },
    {
        icon: Camera,
        title: 'Allow Camera',
        desc: 'When prompted, allow camera access. The back camera will automatically activate to scan room signs around you.',
    },
    {
        icon: ScanSearch,
        title: 'Scan a Room Sign',
        desc: 'Point your camera at any room name or door sign. The app uses OCR to read it and auto-detect your current location on the floor map.',
    },
    {
        icon: MapPin,
        title: 'Pick Your Destination',
        desc: 'Once your location is detected, a bottom sheet appears. Select your destination from the dropdown — e.g. "Lecture Hall A" or "AI HOD".',
    },
    {
        icon: Compass,
        title: 'Follow AR Directions',
        desc: 'A 3D arrow appears on your camera view pointing toward your destination. Follow it! The compass rotates with your device orientation.',
    },
    {
        icon: Map,
        title: 'Switch to 2D Map',
        desc: 'Tap the "2D Map" button in the top-right corner to open the full interactive floor plan with your route highlighted.',
    },
    {
        icon: RefreshCw,
        title: 'Change Destination',
        desc: 'Tap "Change" in the bottom bar to go back and pick a different destination without restarting.',
    },
    {
        icon: ShieldAlert,
        title: 'Emergency Exit',
        desc: 'If there is an emergency, tap "Emergency Exit" — the app instantly calculates the nearest exit and shows the evacuation route in red.',
    },
];

const tips = [
    { icon: MonitorSmartphone, text: 'Keep your phone upright for best AR tracking' },
    { icon: Sun, text: 'Best results in well-lit areas with visible room signs' },
    { icon: BatteryCharging, text: 'Dim your screen to save battery during long navigation' },
    { icon: Volume2, text: 'Use alongside building PA announcements during emergencies' },
];

function GuidePage({ onBack }) {
    const [activeStep, setActiveStep] = useState(null);

    return (
        <div className="guide-page-container">
            {/* Header */}
            <div className="guide-header">
                <div className="guide-header-icon">
                    <Lightbulb size={28} color="#CEB2BD" />
                </div>
                <h1 className="guide-title">
                    How to Use SafeNav
                </h1>
                <p className="guide-subtitle">
                    Follow these steps to navigate indoors using augmented reality.
                </p>
            </div>

            {/* Steps */}
            <div className="guide-content">
                {steps.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = activeStep === i;
                    return (
                        <div
                            key={i}
                            onClick={() => setActiveStep(isActive ? null : i)}
                            className={`guide-card ${isActive ? 'guide-card-active' : ''}`}
                        >
                            {/* Step icon + badge */}
                            <div className="guide-card-left">
                                <div className={`guide-icon-wrapper ${isActive ? 'active' : ''}`}>
                                    <Icon size={20} color={isActive ? '#E2D2C8' : '#CEB2BD'} strokeWidth={1.8} className="guide-icon-svg" />
                                </div>
                                <div className="guide-step-badge">
                                    {i + 1}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="guide-card-right">
                                <div className="guide-card-title">
                                    {step.title}
                                </div>
                                <div className="guide-card-desc" style={{
                                    maxHeight: isActive ? '200px' : '0px',
                                }}>
                                    {step.desc}
                                </div>
                                {!isActive && (
                                    <div className="guide-tap-hint">
                                        Tap to expand ↓
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Tips section */}
                <div className="guide-tips-section">
                    <div className="guide-tips-header">
                        <Lightbulb size={18} strokeWidth={2} />
                        Pro Tips
                    </div>
                    {tips.map((tip, i) => {
                        const TipIcon = tip.icon;
                        return (
                            <div key={i} className={`guide-tip-item ${i < tips.length - 1 ? 'border-b' : ''}`}>
                                <TipIcon size={16} color="#8B6F7B" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                                {tip.text}
                            </div>
                        );
                    })}
                </div>

                {/* Back button */}
                <button
                    className="btn btn-secondary guide-back-btn"
                    onClick={onBack}
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
}

export default GuidePage;
