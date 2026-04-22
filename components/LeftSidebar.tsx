"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Oasis from "../public/Logo.svg";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  number: string;
  address: string;
  imageUrl: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function LeftSidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser?.email) {
          setIsLoading(false);
          return;
        }
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: authUser.email }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' && session?.user?.email) {
        fetchUserProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const isWorker = user?.role === 'worker' || user?.role === 'Worker';

  return (
    <div className="w-full h-full bg-nav px-5 py-8 flex flex-col gap-8 relative">
      <div className="w-full flex gap-4 items-center">
        <Image src={Oasis} alt="Oasis" width={50} height={50} />
        <span className="font-medium text-navtext text-4xl">Oasis</span>
      </div>

      <div>
        <div className="text-navtext text-xl font-semibold mb-3">Services</div>
        <div className="pl-10 font-medium flex flex-col gap-3">
          <Link href="/" className="cursor-pointer hover:text-green-500">
            Home
          </Link>
          <Link href="/training" className="cursor-pointer hover:text-green-500">
            Training
          </Link>
          <Link href="/raise-ticket" className="cursor-pointer hover:text-green-500">
            Raise Ticket
          </Link>
          <Link href="/ticket-history" className="cursor-pointer hover:text-green-500">
            Ticket History
          </Link>
          <Link href="/waste-classifier" className="cursor-pointer hover:text-green-500">
            Waste Classifier
          </Link>
        </div>
      </div>

      <div>
        <div className="text-navtext text-xl font-semibold mb-3">Quick Links</div>
        <div className="pl-10 font-medium flex flex-col gap-3">
          <Link href="/logout" className="cursor-pointer hover:text-green-500">
            Log Out
          </Link>
          <Link href="/help-support" className="cursor-pointer hover:text-green-500">
            Help & Support
          </Link>
          <Link href="/contact-developer" className="cursor-pointer hover:text-green-500">
            Contact Developer
          </Link>
        </div>
      </div>

      {isWorker && (
        <div>
          <div className="text-navtext text-xl font-semibold mb-3">Worker Links</div>
          <div className="pl-10 font-medium flex flex-col gap-3">
            <Link href="/worker/tickets" className="cursor-pointer hover:text-green-500">
              Tickets
            </Link>
            <Link href="/worker/history" className="cursor-pointer hover:text-green-500">
              History
            </Link>
          </div>
        </div>
      )}

      <Link
        href="/report-issue"
        className="text-navtext cursor-pointer self-center font-semibold absolute bottom-10 hover:text-green-500"
      >
        Having an Issue?
      </Link>
    </div>
  );
}