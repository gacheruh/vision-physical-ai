import React, { useState, useEffect } from 'react';
import { Eye, Navigation, ShieldAlert, CheckCircle2, RefreshCw, Camera, Compass } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Frame Ingestion Simulator Form
  const [objectName, setObjectName] = useState('Obstacle_Barrier');
  const [confidence, setConfidence] = useState(0.95);
  const [coordX, setCoordX] = useState(10.0);
  const [coordY, setCoordY] = useState(75.0);
  const [bboxArea, setBboxArea] = useState(850.0);
  const [processResult, setProcessResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchVisionLogs();
  }, []);

  const fetchVisionLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/vision/summary');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessFrame = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setProcessResult(null);
    try {
      const res = await fetch('/api/v1/vision/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detected_object: objectName,
          confidence_score: parseFloat(confidence),
          coordinate_x: parseFloat(coordX),
          coordinate_y: parseFloat(coordY),
          bounding_box_area: parseFloat(bboxArea)
        })
      });
      const json = await res.json();
      setProcessResult(json);
      fetchVisionLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-600 p-2 rounded-lg text-white">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Vision-Based Physical AI & Autonomous Navigation</h1>
              <p className="text-xs text-slate-400">Edge Computer Vision, Spatial Coordinate Mapping & Robotics Commands</p>
            </div>
          </div>
          <button 
            onClick={fetchVisionLogs}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Pipeline
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-grow w-full space-y-8">
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium">Loading vision telemetry and spatial logs...</div>
        ) : (
          <>
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Frames Processed</span>
                  <Camera className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{data?.total_frames_processed || 0}</div>
                <p className="text-xs text-slate-400 mt-1">Live camera stream evaluation</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Average Model Confidence</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{data?.average_confidence || 0}%</div>
                <p className="text-xs text-slate-400 mt-1">CNN classification accuracy</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Navigation Mode</span>
                  <Compass className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">Autonomous</div>
                <p className="text-xs text-slate-400 mt-1">Real-time command generation</p>
              </div>
            </div>

            {/* Two Column Layout: Camera Feed Simulator & Navigation Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Frame Ingestion Simulator */}
              <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="font-bold text-base text-slate-900 mb-1">Simulate Camera Feed Frame</h2>
                <p className="text-xs text-slate-500 mb-6">Process computer vision objects and evaluate spatial coordinates.</p>

                <form onSubmit={handleProcessFrame} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Detected Object / Hazard</label>
                    <select 
                      value={objectName} 
                      onChange={(e) => setObjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                    >
                      <option value="Obstacle_Barrier">Obstacle Barrier</option>
                      <option value="Safety_Cone">Safety Cone</option>
                      <option value="Hazard_Debris">Hazard Debris</option>
                      <option value="Clear_Path">Clear Path</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Model Confidence: {confidence}</label>
                    <input 
                      type="range" min="0.5" max="1.0" step="0.01" value={confidence} 
                      onChange={(e) => setConfidence(e.target.value)}
                      className="w-full accent-orange-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">X-Axis Offset (Pixels): {coordX}</label>
                    <input 
                      type="range" min="-200" max="200" step="5" value={coordX} 
                      onChange={(e) => setCoordX(e.target.value)}
                      className="w-full accent-orange-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Y-Axis Distance (cm): {coordY}</label>
                    <input 
                      type="range" min="10" max="300" step="5" value={coordY} 
                      onChange={(e) => setCoordY(e.target.value)}
                      className="w-full accent-orange-600"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={processing}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50"
                  >
                    {processing ? 'Processing Vision Frame...' : 'Process Frame & Issue Command'}
                  </button>
                </form>

                {processResult && (
                  <div className="mt-6 p-4 rounded-xl border text-sm bg-orange-50 border-orange-200 text-orange-950">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <Navigation className="w-5 h-5 text-orange-600" />
                      <span>Robotics Command: {processResult.robotics_command}</span>
                    </div>
                    <p className="text-xs">Spatial Coordinates X: <strong className="font-mono">{processResult.spatial_coordinates.x}px</strong> | Y: <strong className="font-mono">{processResult.spatial_coordinates.y}cm</strong></p>
                  </div>
                )}
              </div>

              {/* Navigation Log Table */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <h2 className="font-bold text-base text-slate-900 mb-1">Vision Telemetry & Command Log</h2>
                <p className="text-xs text-slate-500 mb-4">Historical object classification and robotics decision commands.</p>

                <div className="overflow-x-auto flex-grow">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
                        <th className="p-3">Frame ID</th>
                        <th className="p-3">Detected Object</th>
                        <th className="p-3">Conf.</th>
                        <th className="p-3">Coords (X, Y)</th>
                        <th className="p-3 text-right">Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {data?.logs?.map((l, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-600 font-sans font-medium">{l.frame_id}</td>
                          <td className="p-3 text-slate-900 font-sans font-semibold">{l.detected_object}</td>
                          <td className="p-3 text-slate-700">{(l.confidence_score * 100).toFixed(0)}%</td>
                          <td className="p-3 text-slate-600">({l.coordinate_x}, {l.coordinate_y})</td>
                          <td className="p-3 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${l.robotics_command === 'STOP' || l.robotics_command === 'EVADE_OBSTACLE' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                              {l.robotics_command}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        GAO Group & Aperture Venture Studio &bull; Vision-Based Physical AI Studio
      </footer>
    </div>
  );
}
