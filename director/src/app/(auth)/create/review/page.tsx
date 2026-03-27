'use client';

import React, { useState } from 'react';

export default function ReviewPage() {
  const [selectedScene, setSelectedScene] = useState('scene-01');

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', color: '#ffffff' }}>
      {/* Fixed Top Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(26,26,26,0.95)',
        backdropFilter: 'blur(12px)',
        height: '4rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.02em' }}>
            DIRECTOR
          </div>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" style={{
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Projects
            </a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            backgroundColor: 'rgba(76,175,80,0.15)',
            color: '#4cb150',
            paddingLeft: '0.75rem',
            paddingRight: '0.75rem',
            paddingTop: '0.375rem',
            paddingBottom: '0.375rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            Film consistency: 91%
          </div>

          <button style={{
            background: 'linear-gradient(135deg, #4cb150 0%, #45a049 100%)',
            color: 'white',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingTop: '0.625rem',
            paddingBottom: '0.625rem',
            borderRadius: '0.375rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            Approve &amp; Continue
          </button>

          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            padding: '0.5rem'
          }}>
            🔔
          </button>
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            padding: '0.5rem'
          }}>
            ❓
          </button>
        </div>
      </header>

      {/* Fixed Left Sidebar */}
      <aside style={{
        position: 'fixed',
        left: 0,
        top: '4rem',
        bottom: 0,
        width: '16rem',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '1.5rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(26,26,26,0.7)',
        backdropFilter: 'blur(12px)',
        overflowY: 'auto'
      }}>
        <button style={{
          width: '100%',
          backgroundColor: '#4cb150',
          color: 'white',
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem',
          borderRadius: '0.375rem',
          border: 'none',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '2rem',
          transition: 'all 0.2s'
        }}>
          + New Project
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <a href="#" style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            borderRadius: '0.375rem',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}>
            Dashboard
          </a>
          <a href="#" style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: 'rgba(76,175,80,0.2)',
            color: '#4cb150',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            Projects
          </a>
          <a href="#" style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            borderRadius: '0.375rem',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}>
            Characters
          </a>
          <a href="#" style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            borderRadius: '0.375rem',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}>
            Settings
          </a>
        </nav>

        <div style={{
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '1rem'
        }}>
          <a href="#" style={{
            display: 'block',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            borderRadius: '0.375rem',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            fontSize: '0.875rem'
          }}>
            Help &amp; Support
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: '16rem',
        marginTop: '4rem',
        padding: '2rem',
        display: 'flex',
        gap: '2rem',
        flex: 1,
        overflowY: 'auto'
      }}>
        {/* Left Section - Scene Grid */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              marginBottom: '1rem',
              letterSpacing: '-0.02em'
            }}>
              Scene Review
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}>
                Filter
              </button>
              <button style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}>
                Grid
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            {/* Scene 01 - Selected */}
            <button
              onClick={() => setSelectedScene('scene-01')}
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                backgroundColor: '#2a2a2a',
                borderRadius: '0.5rem',
                border: selectedScene === 'scene-01' ? '2px solid #4cb150' : '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkn0YsTw2nskN99WICp9Y43R6GKz7iRbl3Hxnq0dINbBJpa6TXM1noSN9gyljvuhep4-3WKRuYrLHKhAIWP9B5JOAa5Q3Av4askqfjK66hUFmUWHIJS5Fo7DGZqnLHJJZShune7nSlHUQYE6Kznykpe9X9cWedznd2mGu0E71gzMV6fGAYFKCqE0walVvQW_HynR1z5aUAMxUFdh4hq1B9KISnAd2ws1yAZNaDNr6BPlH_MJ1InCOFFhsy4pfwa9gJRW7kq1v2U_0"
                  alt="Scene 01"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6))'
                }} />
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                right: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <div style={{
                  backgroundColor: '#4cb150',
                  color: 'white',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  paddingTop: '0.25rem',
                  paddingBottom: '0.25rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: '600'
                }}>
                  CLIP:94
                </div>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem'
                }}>
                  04s
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                SCENE 01
              </div>
            </button>

            {/* Scene 02 */}
            <button
              onClick={() => setSelectedScene('scene-02')}
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                backgroundColor: '#2a2a2a',
                borderRadius: '0.5rem',
                border: selectedScene === 'scene-02' ? '2px solid #4cb150' : '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzHp0xU_Kgq2bqxp5pALccg81D-t_tJGhgbISBLkrGF5Wwo7dB6M15kTYJfc55bKwyNUKMnn7-fm3aV-bwPsRSp-zCN_KxW6kkdn0iVEbG6slEFoLww68nn415UQOfKtZIQpc6aknOWIIzdvk4Erfi1sAsKv9dqdlYXq5RR4a-atif2Y1Vn1gI3EHyCLsor9V_UKLJnc68MuxrMnz_L5aWlFVFdHbbXUYJPmmPz8kvrNa-fxYNK1fDWkIClKnOp3oRhIGWjhPn-wg"
                  alt="Scene 02"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6))'
                }} />
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                right: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <div style={{
                  backgroundColor: 'rgba(156,39,176,0.7)',
                  color: 'white',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  paddingTop: '0.25rem',
                  paddingBottom: '0.25rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: '600'
                }}>
                  CLIP:89
                </div>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem'
                }}>
                  06s
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                SCENE 02
              </div>
            </button>

            {/* Scene 03 - Generating */}
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%',
              backgroundColor: '#2a2a2a',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
              }} />
              <div style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  border: '2px solid rgba(76,175,80,0.3)',
                  borderTop: '2px solid #4cb150',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: '500'
                }}>
                  Rendering
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                SCENE 03
              </div>
            </div>

            {/* Scene 04 */}
            <button
              onClick={() => setSelectedScene('scene-04')}
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                backgroundColor: '#2a2a2a',
                borderRadius: '0.5rem',
                border: selectedScene === 'scene-04' ? '2px solid #4cb150' : '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl-hSrJ-xJSZjJEXrK9EdJ4XQybnVvyGDV4_l4NJoF9mBV7VJKKxUm6guAXE-QTk5PpRBTjUGoCTjogCay92A8UHVHg2ukZTtHfMjd7NBgVOp9dpyWFr71mqDtBZgLr1U_HttijjBPx8Q3b1PZwyJB6ki-JKD0tFpmOs5RJiQT9inGJ9wtIbYVLOr--athVpo0W5teumXolzxMRNH_SPRjDx63TQH5TZRNrPMwxk2bFauNix_yKmAsHD-VgRwdhmM14_cwd9G9Ptk"
                  alt="Scene 04"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6))'
                }} />
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                right: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <div style={{
                  backgroundColor: '#4cb150',
                  color: 'white',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  paddingTop: '0.25rem',
                  paddingBottom: '0.25rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: '600'
                }}>
                  CLIP:91
                </div>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem'
                }}>
                  03s
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                SCENE 04
              </div>
            </button>

            {/* Scene 05 - Error */}
            <button
              onClick={() => setSelectedScene('scene-05')}
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                backgroundColor: '#2a2a2a',
                borderRadius: '0.5rem',
                border: selectedScene === 'scene-05' ? '2px solid #4cb150' : '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4cl4xXnhEAKw_SvE2b-uFETkXlZ6hTa8Xd7B4zFfWQE4FJ2MuJ5dX-lxdiuVNHlihhkIH-lBntlK7Wm1l_VZmWSn-33MCYjFbSYRXC5ZI-lx29AKA3dbVqt9njbhvUb5gzsQetjhsmuJnNVi8H-GNyvU87V14V-ftlQKCzcckc_ALzq4j-TMvFYTyWMB-7BGwC0aOlWI2XGqYgf5b7bYvM6AM_qTdi4KtnSDHlulNAYe-00JElU-8Qc5FS_Y7n3j1bYD5o6HdD2Q"
                  alt="Scene 05"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.6
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6))'
                }} />
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                right: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <div style={{
                  backgroundColor: '#d32f2f',
                  color: 'white',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  paddingTop: '0.25rem',
                  paddingBottom: '0.25rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: '600'
                }}>
                  CLIP:64
                </div>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem'
                }}>
                  00:05
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                SCENE 05
              </div>
            </button>

            {/* Scene 06 - Queued */}
            <button
              onClick={() => setSelectedScene('scene-06')}
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                backgroundColor: '#2a2a2a',
                borderRadius: '0.5rem',
                border: selectedScene === 'scene-06' ? '2px solid #4cb150' : '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#666' }}>hourglass_empty</span>
              </div>
              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                left: '0.5rem',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                SCENE 06
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}