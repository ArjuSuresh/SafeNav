import React, { useState } from 'react';
import {
    Smartphone, Home, Camera, ScanSearch, MapPin,
    Compass, Map, RefreshCw, ShieldAlert,
    Lightbulb, MonitorSmartphone, Sun, BatteryCharging, Volume2,
} from 'lucide-react';

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
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #2D1F2B 0%, #3A2535 50%, #482A41 100%)',
            paddingBottom: '6rem',
        }}>
            {/* Header */}
            <div style={{
                padding: '5rem 1.5rem 2rem',
                textAlign: 'center',
                background: 'linear-gradient(to bottom, rgba(87,46,84,0.15), transparent)',
                borderBottom: '1px solid rgba(226,210,200,0.08)',
            }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '16px',
                    background: 'rgba(87,46,84,0.35)',
                    border: '1px solid rgba(206,178,189,0.2)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem',
                }}>
                    <Lightbulb size={28} color="#CEB2BD" />
                </div>
                <h1 style={{
                    color: '#E2D2C8', fontSize: 'clamp(1.5rem,5vw,2rem)',
                    fontWeight: '700', marginBottom: '0.5rem',
                }}>
                    How to Use SafeNav
                </h1>
                <p style={{ color: '#A0908A', fontSize: '0.95rem', maxWidth: '380px', margin: '0 auto' }}>
                    Follow these steps to navigate indoors using augmented reality.
                </p>
            </div>

            {/* Steps */}
            <div style={{ padding: '1.5rem', maxWidth: '560px', margin: '0 auto' }}>
                {steps.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = activeStep === i;
                    return (
                        <div
                            key={i}
                            onClick={() => setActiveStep(isActive ? null : i)}
                            style={{
                                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                                padding: '1rem 1.25rem',
                                marginBottom: '0.75rem',
                                background: isActive ? 'rgba(87,46,84,0.25)' : 'rgba(226,210,200,0.04)',
                                border: `1px solid ${isActive ? 'rgba(206,178,189,0.35)' : 'rgba(226,210,200,0.07)'}`,
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {/* Step icon + badge */}
                            <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '48px' }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '12px',
                                    background: isActive ? 'rgba(87,46,84,0.5)' : 'rgba(87,46,84,0.25)',
                                    border: `1px solid ${isActive ? 'rgba(206,178,189,0.3)' : 'rgba(206,178,189,0.12)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '6px', margin: '0 auto 6px',
                                }}>
                                    <Icon size={20} color={isActive ? '#E2D2C8' : '#CEB2BD'} strokeWidth={1.8} />
                                </div>
                                <div style={{
                                    background: 'rgba(87,46,84,0.4)',
                                    color: '#CEB2BD',
                                    fontSize: '0.68rem', fontWeight: '700',
                                    borderRadius: '6px', padding: '2px 8px',
                                    display: 'inline-block',
                                    letterSpacing: '0.03em',
                                }}>
                                    {i + 1}
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    color: '#E2D2C8', fontWeight: '600',
                                    fontSize: '0.95rem', marginBottom: '4px',
                                }}>
                                    {step.title}
                                </div>
                                <div style={{
                                    color: '#A0908A', fontSize: '0.85rem',
                                    lineHeight: 1.6,
                                    maxHeight: isActive ? '200px' : '0px',
                                    overflow: 'hidden',
                                    transition: 'max-height 0.3s ease',
                                }}>
                                    {step.desc}
                                </div>
                                {!isActive && (
                                    <div style={{ color: '#8B6F7B', fontSize: '0.78rem', marginTop: '2px' }}>
                                        Tap to expand ↓
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Tips section */}
                <div style={{
                    marginTop: '2rem',
                    background: 'rgba(87,46,84,0.18)',
                    border: '1px solid rgba(206,178,189,0.15)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                }}>
                    <div style={{
                        color: '#CEB2BD', fontWeight: '700', fontSize: '0.95rem',
                        marginBottom: '0.875rem',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        <Lightbulb size={18} strokeWidth={2} />
                        Pro Tips
                    </div>
                    {tips.map((tip, i) => {
                        const TipIcon = tip.icon;
                        return (
                            <div key={i} style={{
                                color: '#A0908A', fontSize: '0.85rem',
                                padding: '0.5rem 0',
                                borderBottom: i < tips.length - 1 ? '1px solid rgba(226,210,200,0.06)' : 'none',
                                lineHeight: 1.5,
                                display: 'flex', alignItems: 'center', gap: '10px',
                            }}>
                                <TipIcon size={16} color="#8B6F7B" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                                {tip.text}
                            </div>
                        );
                    })}
                </div>

                {/* Back button */}
                <button
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '2rem' }}
                    onClick={onBack}
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    );
}

export default GuidePage;
