'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Check, Layers, Loader2 } from 'lucide-react';
import { useMyServicesQuery } from '@/services/service';

export default function LinkServiceModal({
  isOpen,
  onClose,
  selectedServiceId,
  onSelectService,
}) {
  const [search, setSearch] = useState('');
  const [tempSelectedId, setTempSelectedId] = useState(selectedServiceId || null);

  const { data, isLoading } = useMyServicesQuery({ enabled: isOpen });
  const services = data?.services || [];

  // กรองเฉพาะ service ที่ active หรือทั้งหมดของผู้ใช้ และค้นหาตามชื่อ
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    });
  }, [services, search]);

  if (!isOpen) return null;

  const handleSelect = (id) => {
    if (tempSelectedId === id) {
      setTempSelectedId(null);
    } else {
      setTempSelectedId(id);
    }
  };

  const handleDone = () => {
    const chosen = services.find((s) => s.id === tempSelectedId) || null;
    onSelectService(chosen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
              Link to service
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {tempSelectedId ? '1 selected' : '0 selected'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 pb-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search service name"
              className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
            />
          </div>
        </div>

        {/* Services List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-xs">กำลังโหลดรายการบริการ...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-2">
                <Layers className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-gray-600">
                {search ? 'ไม่พบบริการที่ค้นหา' : 'ยังไม่มีบริการ/ประกาศรับงาน'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {search
                  ? 'ลองค้นหาด้วยคำอื่น'
                  : 'สร้างบริการในแท็บ Services ก่อนนำมาเชื่อมโยง'}
              </p>
            </div>
          ) : (
            filteredServices.map((service) => {
              const isSelected = tempSelectedId === service.id;
              const cover =
                service.coverUrl ||
                (Array.isArray(service.images) && service.images[0]) ||
                '/empty/no-image.png';

              return (
                <div
                  key={service.id}
                  onClick={() => handleSelect(service.id)}
                  className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-black bg-gray-50/70 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/40'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-14 w-18 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover}
                      alt={service.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/empty/no-image.png';
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                      {service.title}
                    </h4>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">
                      {service.startPrice !== undefined && service.startPrice !== null
                        ? service.endPrice !== undefined && service.endPrice !== null && Number(service.endPrice) > Number(service.startPrice)
                          ? `฿${Number(service.startPrice).toLocaleString()} - ฿${Number(service.endPrice).toLocaleString()}`
                          : `฿${Number(service.startPrice).toLocaleString()}`
                        : service.priceText ||
                          (service.price
                            ? `฿${Number(service.price).toLocaleString()}`
                            : 'ติดต่อสอบถาม')}
                    </p>
                  </div>

                  {/* Radio / Check Circle */}
                  <div
                    className={`h-6 w-6 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                      isSelected
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-xl bg-black px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
