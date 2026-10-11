'use client';

import { useState } from 'react';
import { ProductCard } from '@/components/marketplace';
import JobCard from '@/components/jobs/JobCard';
import ServiceCard from '@/components/services/ServiceCard';
import EventCard from '@/components/events/EventCard';
import type { Product } from '@/services/marketplace.service';
import type { Event, Job, Service } from '@/types/api';

const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString();

// Sample items for the design kit only. Prices are in kobo, as the API sends them.
const PRODUCTS = [
  { id: 'dk-p1', title: 'Fairly used fridge, still cold', price: 18500000, currency: 'NGN', negotiable: true, condition: 'used', category: 'Home', images: ['/illustration_marketplace.png', '/illustration_delivery.png'], status: 'active', sellerId: 'someone', createdAt: hoursAgo(3), engagement: { likesCount: 4, commentsCount: 2, isLiked: false } },
  { id: 'dk-p2', title: 'Ankara fabric, 6 yards', price: 1200000, currency: 'NGN', condition: 'new', category: 'Fashion', images: [], status: 'sold', sellerId: 'someone', createdAt: hoursAgo(30), engagement: { likesCount: 0, commentsCount: 0 } },
] as unknown as Product[];

const JOBS = [
  { id: 'dk-j1', title: 'Shop assistant for provision store', type: 'full-time', workMode: 'on-site', status: 'open', salary: { min: 6000000, max: 9000000, currency: 'NGN', period: 'month' }, employer: { firstName: 'Mama', lastName: 'Tolu' }, location: { lga: 'Somolu' }, applications: 5, createdAt: hoursAgo(5) },
  { id: 'dk-j2', title: 'Weekend generator repair', type: 'contract', workMode: 'on-site', status: 'filled', employer: { username: 'estate_exco' }, location: { lga: 'Yaba' }, createdAt: hoursAgo(80) },
] as unknown as Job[];

const SERVICES = [
  { id: 'dk-s1', title: 'Plumbing and borehole repair', pricing: { amount: 500000, currency: 'NGN', type: 'hourly' }, provider: { username: 'segun', firstName: 'Segun' }, category: 'Plumbing', isVerified: true, rating: 4.8, reviews: 23, completedJobs: 41, images: ['/illustration_delivery.png'] },
  { id: 'dk-s2', title: 'Home lesson teacher, JSS maths', pricing: {}, provider: { username: 'ada' }, category: 'Lessons', rating: 0, reviews: 0, images: [] },
] as unknown as Service[];

const EVENTS = [
  { id: 'dk-e1', title: 'Estate sanitation and small chops', type: 'community', status: 'upcoming', startDate: inDays(3), venue: 'Bode Thomas park', isFree: true, attendeesCount: 18, capacity: 50, coverImage: '/illustration_events.png' },
  { id: 'dk-e2', title: 'Street football final', type: 'sports', status: 'cancelled', startDate: inDays(6), venue: 'Ojuelegba field', ticketPrice: 100000, attendeesCount: 40 },
] as unknown as Event[];

export function BrowseTilesDemo() {
  const [saved, setSaved] = useState(false);
  const [fav, setFav] = useState(false);
  const [going, setGoing] = useState(false);
  return (
    <div className="grid grid-cols-2 gap-3">
      {PRODUCTS.map((p) => (
        <ProductCard key={p.id} product={p} currentUserId="design-kit" />
      ))}
      <JobCard job={{ ...JOBS[0], isSaved: saved } as Job} onSave={() => setSaved((v) => !v)} onApply={() => {}} />
      <JobCard job={JOBS[1]} onSave={() => {}} />
      <ServiceCard service={{ ...SERVICES[0], isFavorited: fav } as Service} onFavorite={() => setFav((v) => !v)} />
      <ServiceCard service={SERVICES[1]} />
      <EventCard event={{ ...EVENTS[0], isAttending: going } as Event} onAttend={() => setGoing((v) => !v)} />
      <EventCard event={EVENTS[1]} onAttend={() => {}} />
    </div>
  );
}
