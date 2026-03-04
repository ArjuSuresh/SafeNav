import React, { useState } from 'react';

const steps = [
    {
        icon: '🌐',
        title: 'Open on Mobile',
        desc: 'Scan the QR code or open the website link on your Android/iOS phone browser (Chrome recommended). The site is optimized for mobile.',
    },
    {
        icon: '🏠',
        title: 'Start from Home',
        desc: 'You\'ll land on the Home page. Tap "Navigate" from the navbar or the "Start Navigation" button to begin.',
    },
    {
        icon: '📷',
        title: 'Allow Camera',
        desc: 'When prompted, allow camera access. The back camera will automatically activate to scan room signs around you.',
    },
    {
        icon: '🔍',
        title: 'Scan a Room Sign',
        desc: 'Point your camera at any room name or door sign. The app uses OCR to read it and auto-detect your current location on the floor map.',
    },
    {
        icon: '🎯',
        title: 'Pick Your Destination',
        desc: 'Once your location is detected, a bottom sheet appears. Select your destination from the dropdown — e.g. "Lecture Hall A" or "AI HOD".',
    },
    {
        icon: '🧭',
        title: 'Follow AR Directions',
        desc: 'A 3D arrow appears on your camera view pointing toward your destination. Follow it! The compass rotates with your device orientation.',
    },
    {
        icon: '🗺️',
        title: 'Switch to 2D Map',
        desc: 'Tap "🗺️ 2D Map" in the top-right corner to open the full interactive floor plan with your route highlighted.',
    },
    {
        icon: '🔁',
        title: 'Change Destination',
        desc: 'Tap "Change Dest." in the bottom bar to go back and pick a different destination without restarting.',
    },
    {
        icon: '🚨',
        title: 'Emergency Exit',
        desc: 'If there is an emergency, tap "🚨 Emergency Exit" — the app instantly calculates the nearest exit and shows the evacuation route in red.',
    },
];

const tips = [
    '📱 Keep your phone upright for best AR tracking',
    '💡 Best results in well-lit areas with visible room signs',
    '🔋 Dim your screen to save battery during long navigation',
    '🔊 Use alongside building PA announcements during emergencies',
];

function GuidePage({ onBack }) {
    const [activeStep, setActiveStep] = useState(null);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #0B0F19 0%, #121A2F 100%)',
            paddingBottom: '6rem',
        }}>
            {/* Header */}
            <div style={{
                padding: '5rem 1.5rem 2rem',
                textAlign: 'center',
                background: 'linear-gradient(to bottom, rgba(59,130,246,0.08), transparent)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📖</div>
                <h1 style={{
                    color: '#fff', fontSize: 'clamp(1.5rem,5vw,2rem)',
                    fontWeight: '700', marginBottom: '0.5rem',
                }}>
                    How to Use SafeNav
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '340px', margin: '0 auto' }}>
                    Follow these steps to navigate indoors using augmented reality.
                </p>
            </div>

            {/* Steps */}
            <div style={{ padding: '1.5rem', maxWidth: '560px', margin: '0 auto' }}>
                {steps.map((step, i) => (
                    <div
                        key={i}
                        onClick={() => setActiveStep(activeStep === i ? null : i)}
                        style={{
                            display: 'flex', gap: '1rem', alignItems: 'flex-start',
                            padding: '1rem 1.25rem',
                            marginBottom: '0.75rem',
                            background: activeStep === i ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${activeStep === i ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {/* Step number + icon */}
                        <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '48px' }}>
                            <div style={{
                                fontSize: '1.5rem', lineHeight: 1,
                                marginBottom: '4px',
                            }}>
                                {step.icon}
                            </div>
                            <div style={{
                                background: 'rgba(59,130,246,0.3)',
                                color: '#93c5fd',
                                fontSize: '0.7rem', fontWeight: '700',
                                borderRadius: '6px', padding: '2px 6px',
                                display: 'inline-block',
                            }}>
                                Step {i + 1}
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                color: '#fff', fontWeight: '600',
                                fontSize: '0.95rem', marginBottom: '4px',
                            }}>
                                {step.title}
                            </div>
                            <div style={{
                                color: '#94a3b8', fontSize: '0.85rem',
                                lineHeight: 1.6,
                                maxHeight: activeStep === i ? '200px' : '0px',
                                overflow: 'hidden',
                                transition: 'max-height 0.3s ease',
                            }}>
                                {step.desc}
                            </div>
                            {activeStep !== i && (
                                <div style={{ color: '#3b82f6', fontSize: '0.78rem', marginTop: '2px' }}>
                                    Tap to expand ↓
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Tips section */}
                <div style={{
                    marginTop: '2rem',
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                }}>
                    <div style={{ color: '#10b981', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.875rem' }}>
                        💡 Pro Tips
                    </div>
                    {tips.map((tip, i) => (
                        <div key={i} style={{
                            color: '#94a3b8', fontSize: '0.85rem',
                            padding: '0.375rem 0',
                            borderBottom: i < tips.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            lineHeight: 1.5,
                        }}>
                            {tip}
                        </div>
                    ))}
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
