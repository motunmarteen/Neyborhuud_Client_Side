'use client';

import { MapPin, PersonPin, SentinelOrb } from '@/components/map/Pins';
import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';
import MapPinAvatar from '@/components/ui/MapPinAvatar';

export function PinsDemo() {
  return (
    <div className="relative grid grid-cols-4 place-items-center gap-y-12 rounded-[22px] bg-[#E6EFE3] px-2 pb-12 pt-10">
      <MapPin emoji="🚨" ring="red" ripple label="Safety report: suspicious movement" />
      <MapPin emoji="💡" ring="amber" label="Light update" />
      <MapPin emoji="📢" ring="blue" label="FYI: water supply off tomorrow" />
      <MapPin emoji="🙋🏾" ring="purple" label="Help request: jumper cables" />
      <MapPin emoji="🧊" tag="₦180k" label="Chest freezer for sale" />
      <MapPin emoji="🎉" count={3} label="3 events here" />
      <PersonPin me name="Tunde Bakare" />
      <PersonPin champion name="Kemi" />
      <PersonPin name="Aisha Bello" />
      <MapPin emoji="🍲" size="sm" label="Mama Put buka" />
      <SentinelOrb mood="advisory" />
      <SentinelOrb mood="calm" />
      <div className="col-span-4 flex items-end justify-center gap-5 pt-2">
        <BrandPinAvatar src="/images/auth-hero.jpg" alt="Profile photo pin" size="hero" />
        <BrandPinAvatar alt="Profile pin without a photo" fallbackInitial="A" size="lg" />
        <MapPinAvatar src="/images/auth-hero.jpg" alt="Small profile pin" size="md" />
        <MapPinAvatar alt="Small pin without a photo" fallbackInitial="T" size="md" />
      </div>
    </div>
  );
}
