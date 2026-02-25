import React, { useState, useEffect, useRef } from 'react';
import { Map, Shield, Flame, Skull, Mountain, Castle, Tent, Swords, Navigation, Sparkles, ZoomIn, ZoomOut, Maximize, Loader2 } from 'lucide-react';
import localIntel from './local-intel.json';
import locationDesc from './location-desc.json';

// 设定各方势力颜色
const FACTIONS = {
  TANG: { id: 'tang', name: '关中残唐', color: 'bg-blue-500', text: 'text-blue-300', border: 'border-blue-500', shadow: 'shadow-blue-500/50' },
  XUANHUO: { id: 'xuanhuo', name: '玄火教势力', color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', shadow: 'shadow-red-500/50' },
  JIN: { id: 'jin', name: '北晋政权', color: 'bg-purple-500', text: 'text-purple-300', border: 'border-purple-500', shadow: 'shadow-purple-500/50' },
  CHAOS: { id: 'chaos', name: '割据/混乱区', color: 'bg-amber-500', text: 'text-amber-300', border: 'border-amber-500', shadow: 'shadow-amber-500/50' },
  NEUTRAL: { id: 'neutral', name: '中立防守', color: 'bg-emerald-500', text: 'text-emerald-300', border: 'border-emerald-500', shadow: 'shadow-emerald-500/50' },
};

// 地理节点数据（已根据提供的图片重新校准坐标）
const LOCATIONS = [
  {
    id: 'monan', name: '漠南草原', type: 'region', faction: FACTIONS.CHAOS, icon: Tent,
    x: 32, y: 10,
    desc: locationDesc.monan
  },
  {
    id: 'yanmen', name: '雁门关外据点', type: 'node', faction: FACTIONS.NEUTRAL, icon: Shield,
    x: 30, y: 22,
    desc: locationDesc.yanmen
  },
  {
    id: 'yilan', name: '翼岚城', type: 'city', faction: FACTIONS.TANG, icon: Castle,
    x: 50, y: 26,
    desc: locationDesc.yilan
  },
  {
    id: 'jin', name: '北晋', type: 'region', faction: FACTIONS.JIN, icon: Castle,
    x: 38, y: 28,
    desc: locationDesc.jin
  },
  {
    id: 'liaodong', name: '辽东郡', type: 'region', faction: FACTIONS.CHAOS, icon: Swords,
    x: 90, y: 22,
    desc: locationDesc.liaodong
  },
  {
    id: 'changbai', name: '长白山', type: 'region', faction: FACTIONS.TANG, icon: Mountain,
    x: 80, y: 18,
    desc: locationDesc.changbai
  },
  {
    id: 'mohe', name: '黑水靺鞨部', type: 'region', faction: FACTIONS.NEUTRAL, icon: Tent,
    x: 88, y: 8,
    desc: locationDesc.mohe
  },
  {
    id: 'hedong', name: '河东地区', type: 'region', faction: FACTIONS.XUANHUO, icon: Skull,
    x: 65, y: 45,
    desc: locationDesc.hedong
  },
  {
    id: 'changan', name: '长安', type: 'city', faction: FACTIONS.CHAOS, icon: Castle,
    x: 42, y: 52,
    desc: locationDesc.changan
  },
  {
    id: 'zhongnan', name: '关中残唐 (终南山)', type: 'region', faction: FACTIONS.TANG, icon: Mountain,
    x: 48, y: 55,
    desc: locationDesc.zhongnan
  },
  {
    id: 'passes', name: '潼关 / 函谷关', type: 'node', faction: FACTIONS.XUANHUO, icon: Shield,
    x: 58, y: 62,
    desc: locationDesc.passes
  },
  {
    id: 'luoyang', name: '洛阳', type: 'city', faction: FACTIONS.XUANHUO, icon: Flame,
    x: 72, y: 65,
    desc: locationDesc.luoyang
  },
  {
    id: 'jiange', name: '剑阁', type: 'node', faction: FACTIONS.TANG, icon: Shield,
    x: 26, y: 70,
    desc: locationDesc.jiange
  },
  {
    id: 'shuzhong', name: '蜀中 (成都)', type: 'region', faction: FACTIONS.TANG, icon: Castle,
    x: 34, y: 84,
    desc: locationDesc.shuzhong
  },
  {
    id: 'jiangnan', name: '淮南/江南地区', type: 'region', faction: FACTIONS.CHAOS, icon: Swords,
    x: 80, y: 80,
    desc: locationDesc.jiangnan
  },
  {
    id: 'yangzhou', name: '扬州', type: 'city', faction: FACTIONS.XUANHUO, icon: Flame,
    x: 90, y: 72,
    desc: locationDesc.yangzhou
  },
  {
    id: 'lingnan', name: '岭南地区', type: 'region', faction: FACTIONS.CHAOS, icon: Swords,
    x: 35, y: 92,
    desc: locationDesc.lingnan
  }
];

// 定义路线连线
const ROUTES = [
  { from: 'yilan', to: 'yanmen' },
  { from: 'yilan', to: 'changan' },
  { from: 'changan', to: 'passes' },
  { from: 'passes', to: 'luoyang' },
  { from: 'changan', to: 'zhongnan' },
  { from: 'zhongnan', to: 'jiange' },
  { from: 'jiange', to: 'shuzhong' },
  { from: 'luoyang', to: 'hedong' },
  { from: 'luoyang', to: 'jiangnan' },
  { from: 'jiangnan', to: 'yangzhou' },
];

const INTEL_FALLBACK = '风声将起，火线未明。每一条传闻都可能是诱饵，也可能是唯一活路。';

const INTEL_ARCHIVE = LOCATIONS.reduce((archive, node) => {
  const intelPool = localIntel[node.id];
  if (Array.isArray(intelPool) && intelPool.length > 0) {
    archive[node.id] = intelPool;
  } else if (typeof intelPool === 'string' && intelPool.trim()) {
    archive[node.id] = [intelPool];
  } else {
    archive[node.id] = [INTEL_FALLBACK];
  }
  return archive;
}, {});

const pickRandomIntel = (pool, previousIntel = '') => {
  if (!pool || pool.length === 0) return INTEL_FALLBACK;
  if (pool.length === 1) return pool[0];

  let nextIntel = pool[Math.floor(Math.random() * pool.length)];
  while (nextIntel === previousIntel) {
    nextIntel = pool[Math.floor(Math.random() * pool.length)];
  }
  return nextIntel;
};

export default function App() {
  const [selectedNode, setSelectedNode] = useState(LOCATIONS[2]); // 默认选中翼岚城
  const [showPlot, setShowPlot] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [intelText, setIntelText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 地图缩放与拖拽状态
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(1);
  const intelTimeoutRef = useRef(null);
  const viewportRef = useRef(null);
  const mapLayerRef = useRef(null);

  // 龙御的复仇路线点（高亮）
  const plotNodes = ['yilan', 'yanmen', 'passes', 'luoyang', 'jiange', 'shuzhong'];

  const clampPan = (nextPan, zoomValue = zoom) => {
    const viewportEl = viewportRef.current;
    const layerEl = mapLayerRef.current;
    if (!viewportEl || !layerEl) return nextPan;

    const viewportWidth = viewportEl.clientWidth;
    const viewportHeight = viewportEl.clientHeight;
    const layerWidth = layerEl.offsetWidth;
    const layerHeight = layerEl.offsetHeight;

    const scaledWidth = layerWidth * zoomValue;
    const scaledHeight = layerHeight * zoomValue;

    const maxX = Math.max(0, (scaledWidth - viewportWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - viewportHeight) / 2);

    return {
      x: Math.min(maxX, Math.max(-maxX, nextPan.x)),
      y: Math.min(maxY, Math.max(-maxY, nextPan.y)),
    };
  };

  // 缩放与平移处理函数
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSensitivity = 0.002;
    const delta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.max(0.5, Math.min(zoom + delta, 6)); // 限制缩放在 0.5x 到 6x 之间
    setZoom(newZoom);
    setPan((prev) => clampPan(prev, newZoom));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const nextPan = { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y };
    setPan(clampPan(nextPan));
  };

  const handleMouseUp = () => setIsDragging(false);

  const getTouchDistance = (touchA, touchB) => {
    const dx = touchA.clientX - touchB.clientX;
    const dy = touchA.clientY - touchB.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length >= 2) {
      setIsDragging(false);
      setIsPinching(true);
      pinchStartDistance.current = getTouchDistance(e.touches[0], e.touches[1]);
      pinchStartZoom.current = zoom;
      return;
    }
    if (!e.touches.length) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length >= 2) {
      setIsPinching(true);
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      if (pinchStartDistance.current > 0) {
        const scale = currentDistance / pinchStartDistance.current;
        const newZoom = Math.max(0.5, Math.min(pinchStartZoom.current * scale, 6));
        setZoom(newZoom);
        setPan((prev) => clampPan(prev, newZoom));
      }
      return;
    }
    if (!isDragging || !e.touches.length) return;
    const touch = e.touches[0];
    const nextPan = { x: touch.clientX - dragStart.current.x, y: touch.clientY - dragStart.current.y };
    setPan(clampPan(nextPan));
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      pinchStartDistance.current = 0;
      setIsPinching(false);
    }
    if (!e.touches.length) {
      setIsDragging(false);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // 移动端布局状态
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobileLayout = () => {
      const isMobile = mediaQuery.matches;
      if (!isMobile) setIsMobilePanelOpen(true);
      if (isMobile) setIsMobilePanelOpen(false);
      setPan((prev) => clampPan(prev));
    };

    updateMobileLayout();
    window.addEventListener('resize', updateMobileLayout);
    return () => window.removeEventListener('resize', updateMobileLayout);
  }, []);

  useEffect(() => {
    setPan((prev) => clampPan(prev, zoom));
  }, [zoom]);

  useEffect(() => () => {
    if (intelTimeoutRef.current) {
      clearTimeout(intelTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    setIntelText('');
    setErrorMsg('');
  }, [selectedNode.id]);

  const handleProbeIntel = () => {
    if (isGenerating) return;

    setErrorMsg('');
    setIsGenerating(true);
    const delay = 2000 + Math.floor(Math.random() * 1000);
    intelTimeoutRef.current = setTimeout(() => {
      try {
        const nextPool = INTEL_ARCHIVE[selectedNode.id] || [INTEL_FALLBACK];
        setIntelText((prev) => pickRandomIntel(nextPool, prev));
      } catch (error) {
        setErrorMsg('暗网回路中断，情报截取失败，请稍后重试。');
      } finally {
        setIsGenerating(false);
        intelTimeoutRef.current = null;
      }
    }, delay);
  };

  return (
    <div className="app-shell flex bg-[#1c1c1e] text-slate-200 font-sans overflow-hidden relative">
      
      {/* 左侧/主视图：交互地图 */}
      <div className="flex-1 relative border-r border-slate-800 bg-[#342d25] overflow-hidden">

        {/* 顶部标题区 */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex flex-col gap-2">
          <h1 className="text-2xl md:text-4xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-600 drop-shadow-md">
            唐烬
          </h1>
          <p className="text-amber-100/70 font-bold text-xs md:text-sm tracking-widest drop-shadow-md">乱 世 堪 舆 图</p>
          
          <button 
            onClick={() => setShowPlot(!showPlot)}
            className={`mt-2 md:mt-4 px-3 md:px-4 py-2 w-max rounded border text-xs font-bold tracking-wider transition-all duration-300 shadow-md ${
              showPlot ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {showPlot ? '关闭复仇路线' : '开启复仇路线'}
          </button>
        </div>

        {/* 图例 */}
        <div className="absolute bottom-6 left-6 z-20 bg-slate-900/80 p-4 border border-slate-700 rounded-lg backdrop-blur-md shadow-xl hidden md:block">
          <h3 className="text-xs font-bold text-slate-400 mb-3 tracking-widest uppercase">势力分布</h3>
          <div className="flex flex-col gap-2">
            {Object.values(FACTIONS).map(f => (
              <div key={f.id} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${f.color} shadow-[0_0_8px_rgba(0,0,0,0.8)]`} />
                <span className="text-xs text-slate-200 font-semibold">{f.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 控制面板：缩放按钮 */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-30 flex flex-col gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.5, 6))} className="p-2 bg-slate-900/80 border border-slate-700 rounded text-slate-300 hover:bg-slate-700 hover:text-white shadow-xl backdrop-blur-md transition-colors" title="放大">
            <ZoomIn size={18} />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} className="p-2 bg-slate-900/80 border border-slate-700 rounded text-slate-300 hover:bg-slate-700 hover:text-white shadow-xl backdrop-blur-md transition-colors" title="缩小">
            <ZoomOut size={18} />
          </button>
          <button onClick={resetView} className="p-2 bg-slate-900/80 border border-slate-700 rounded text-slate-300 hover:bg-slate-700 hover:text-white shadow-xl backdrop-blur-md transition-colors" title="重置视角">
            <Maximize size={18} />
          </button>
        </div>

        {/* 交互地图事件容器 */}
        <div 
          ref={viewportRef}
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center touch-none select-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 缩放与平移的物理画板 - 使用相对宽高比盒子以适配背景图片 */}
          <div 
            ref={mapLayerRef}
            className={`relative w-full h-full min-w-[800px] origin-center ${
              isDragging || isPinching ? '' : 'transition-transform duration-75 ease-out'
            }`}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {/* 用户上传的真实地图作为底图 */}
            {/* 注意：在您的本地项目中，请将 src 改回 "image_5f625e.jpg" 并将其放在 public 目录下 */}
            <img 
              src="map.png" 
              alt="唐烬地图底底图" 
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover opacity-90 rounded shadow-2xl" 
              onDragStart={(e) => e.preventDefault()}
              onError={(e) => {
                // 如果图片路径失效时的 fallback 样式
                e.target.style.display = 'none';
                e.target.parentElement.style.backgroundColor = '#d2c0a3';
                e.target.parentElement.style.backgroundImage = 'url("https://www.transparenttextures.com/patterns/aged-paper.png")';
              }}
            />

            {/* 连线 SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {ROUTES.map((route, idx) => {
                const from = LOCATIONS.find(l => l.id === route.from);
                const to = LOCATIONS.find(l => l.id === route.to);
                if(!from || !to) return null;
                
                const isPlotRoute = showPlot && plotNodes.includes(from.id) && plotNodes.includes(to.id);
                
                return (
                  <line 
                    key={idx}
                    x1={`${from.x}%`} y1={`${from.y}%`}
                    x2={`${to.x}%`} y2={`${to.y}%`}
                    stroke={isPlotRoute ? '#d97706' : 'rgba(0,0,0,0.3)'}
                    strokeWidth={isPlotRoute ? '4' : '2'}
                    strokeDasharray={isPlotRoute ? '8 4' : '4 6'}
                    className={isPlotRoute ? 'animate-pulse' : ''}
                  />
                );
              })}
            </svg>

            {/* 渲染地理节点 */}
            {LOCATIONS.map(node => {
              const isSelected = selectedNode.id === node.id;
              const isPlotNode = showPlot && plotNodes.includes(node.id);
              const Icon = node.icon;

              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                    if (window.innerWidth < 768) {
                      setIsMobilePanelOpen(true);
                    }
                  }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group
                    ${isSelected ? 'z-30 scale-125' : 'z-20 hover:scale-110'}
                  `}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  {/* 节点光晕 */}
                  <div className={`absolute inset-0 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity ${node.faction.color} ${isSelected ? 'animate-pulse opacity-100' : ''}`} />
                  
                  {/* 节点图标体 */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border border-slate-900 bg-slate-800 shadow-[0_4px_6px_rgba(0,0,0,0.6)]
                    ${isSelected ? 'shadow-[0_0_15px_rgba(255,255,255,0.6)] ring-2 ring-white' : ''}
                    ${isPlotNode ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-transparent' : ''}
                  `}>
                    <Icon size={16} className={node.faction.text} />
                  </div>
                
                  {/* 节点标签：去除了阴影，改为深色文字以适配明亮底图 */}
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1 whitespace-nowrap font-black text-[14px] tracking-widest text-slate-900
                    ${isSelected ? 'scale-110 z-30' : ''}
                  `}>
                    {node.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 右侧：详细信息面板 */}
      <div className={`mobile-scroll-panel fixed md:static inset-y-0 right-0 w-[86vw] max-w-[360px] md:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl z-40 overflow-y-auto transition-transform duration-300 ${
        isMobilePanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}>
        
        {/* 头图区 */}
        <div className={`h-40 shrink-0 w-full relative overflow-hidden ${selectedNode.faction.color} bg-opacity-10 border-b border-slate-800 flex items-center justify-center`}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
          <selectedNode.icon size={64} className={`opacity-20 ${selectedNode.faction.text}`} />
          
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
             <div>
               <span className={`text-xs font-bold tracking-widest uppercase px-2 py-1 rounded-sm bg-slate-900/80 border ${selectedNode.faction.border} ${selectedNode.faction.text}`}>
                 {selectedNode.faction.name}
               </span>
               <h2 className="text-2xl font-bold mt-2 text-white">{selectedNode.name}</h2>
             </div>
          </div>
        </div>

        {/* 详细内容区 */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* 地理描述 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-2">
              <Map size={16} /> 疆域局势
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed text-justify">
              {selectedNode.desc}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-3">
              <Navigation size={16} /> 剧情要素与地标
            </h3>
            <div className="space-y-3">
              {selectedNode.id === 'yilan' && (
                <>
                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-amber-400 text-sm block mb-1">【静尘寺】</strong>
                    <p className="text-xs text-slate-400">位于翼岚城近郊。龙御从皇城之战噩梦中苏醒之地，也是他踏上复仇旅程的起点。静谧的氛围与战火形成鲜明对比。</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <strong className="text-blue-400 text-sm block mb-1">【裕和当】</strong>
                    <p className="text-xs text-slate-400">位于翼岚城内，残唐“暗司”据点之一。</p>
                  </div>
                </>
              )}
              {selectedNode.id === 'luoyang' && (
                <div className="p-3 bg-red-950/30 rounded border border-red-900/50">
                  <strong className="text-red-400 text-sm block mb-1">【雁回崖】</strong>
                  <p className="text-xs text-slate-400">距洛阳十里邙山余脉。龙御坠崖处，承载着他最深的愧疚与仇恨。布满玄火教暗哨，是复仇途中必访之地。</p>
                </div>
              )}
              {selectedNode.id === 'zhongnan' && (
                <div className="p-3 bg-slate-900 rounded border border-slate-800">
                  <strong className="text-blue-400 text-sm block mb-1">【天下第一福地】</strong>
                  <p className="text-xs text-slate-400">东起杨家堡，西至太白山南梁。残唐最后的遮羞布，兵力匮乏，仅能在群山之间苟延残喘。</p>
                </div>
              )}
              {selectedNode.id === 'jiange' && (
                <div className="p-3 bg-slate-900 rounded border border-slate-800">
                  <strong className="text-slate-200 text-sm block mb-1">【天险咽喉】</strong>
                  <p className="text-xs text-slate-400">龙御前往成都寻求残唐支援时，必须突破或途经的战略防线。</p>
                </div>
              )}
              {selectedNode.id === 'passes' && (
                <div className="p-3 bg-slate-900 rounded border border-slate-800">
                  <strong className="text-red-400 text-sm block mb-1">【东进阻碍】</strong>
                  <p className="text-xs text-slate-400">龙御从西部前往中原、直取洛阳的必经之路，生死难关。</p>
                </div>
              )}
              
              {!['yilan', 'luoyang', 'zhongnan', 'jiange', 'passes'].includes(selectedNode.id) && (
                <p className="text-xs text-slate-500 italic">此区域广袤，暗流涌动，等待探索...</p>
              )}
            </div>
          </div>

          {/* 本地情报区 */}
          <div className="border-t border-slate-800 pt-6 mt-6">
             <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-2 mb-3">
               <Sparkles size={16} /> 动态暗网情报
             </h3>
             {!isGenerating && !intelText && (
               <button
                 type="button"
                 onClick={handleProbeIntel}
                 className="mb-3 w-full rounded border px-3 py-2 text-xs font-bold tracking-wider transition-colors bg-indigo-950/60 border-indigo-800 text-indigo-200 hover:bg-indigo-900/70"
               >
                 探听坊间传闻
               </button>
             )}
             {isGenerating && (
               <div className="p-4 bg-indigo-950/20 border border-indigo-900/50 rounded flex flex-col items-center justify-center gap-2 text-indigo-400">
                 <Loader2 size={20} className="animate-spin" />
                 <span className="text-xs">暗司密探正在截取飞鸽传书...</span>
               </div>
             )}

             {errorMsg && !isGenerating && (
               <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-red-400 text-xs">
                 {errorMsg}
               </div>
             )}

             {!isGenerating && intelText && (
               <div className="relative p-4 bg-slate-900 border border-indigo-900/50 rounded text-slate-300 text-sm leading-relaxed">
                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l"></div>
                 <p className="italic font-serif">"{intelText}"</p>
                 <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
                   <span>— 来源：坊间轶闻</span>
                   <button
                     type="button"
                     onClick={handleProbeIntel}
                     className="text-indigo-300 hover:text-indigo-200 transition-colors"
                   >
                     重新探听
                   </button>
                 </div>
               </div>
             )}
          </div>
          
        </div>
      </div>

      {!isMobilePanelOpen && (
        <button
          onClick={() => setIsMobilePanelOpen(true)}
          className="md:hidden fixed bottom-4 right-4 z-50 px-3 py-2 text-xs font-bold tracking-wider rounded bg-slate-900/90 text-slate-200 border border-slate-700"
        >
          查看地点详情
        </button>
      )}

      {isMobilePanelOpen && (
        <button
          onClick={() => setIsMobilePanelOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-black/30"
          aria-label="关闭地点详情"
        />
      )}
    </div>
  );
}
