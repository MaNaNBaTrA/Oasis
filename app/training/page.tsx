'use client'
import React, { useState, useEffect } from 'react';
import { ChevronRight, Book, Recycle, Trash2, Leaf, AlertTriangle, Clock } from 'lucide-react';
import { useRouter } from "next/navigation";




interface Lesson {
  title: string;
  content: string;
}

interface TrainingModule {
  id: number;
  title: string;
  icon: React.ReactNode;
  duration: string;
  lessons: Lesson[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const WasteManagementTraining: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<number>(0);
  const [currentLesson, setCurrentLesson] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const router = useRouter();

  const trainingModules: TrainingModule[] = [
    {
      id: 0,
      title: "Waste Classification & Sorting",
      icon: <Recycle className="w-6 h-6" />,
      duration: "15 min",
      lessons: [
        {
          title: "Types of Waste",
          content: `
            <h3 class="text-xl font-bold mb-4 text-green-700">Understanding Different Types of Waste</h3>
            <div class="space-y-4">
              <p class="text-gray-700 mb-4">Proper waste classification is the foundation of effective waste management. Understanding different waste categories helps us dispose of materials correctly and minimize environmental impact.</p>
              
              <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 class="font-semibold text-blue-700 mb-2">🔵 Recyclable Waste</h4>
                <p class="text-sm mb-2">Materials that can be processed and transformed into new products:</p>
                <ul class="text-sm space-y-1 ml-4 list-disc list-inside">
                  <li>Paper and cardboard (newspapers, magazines, boxes)</li>
                  <li>Plastic bottles and containers (check recycling numbers)</li>
                  <li>Glass containers (bottles, jars)</li>
                  <li>Metal cans (aluminum, steel)</li>
                </ul>
                <p class="text-xs text-blue-600 mt-2 font-medium">Tip: Clean containers before recycling to avoid contamination.</p>
              </div>
              
              <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 class="font-semibold text-green-700 mb-2">🟢 Organic/Compostable Waste</h4>
                <p class="text-sm mb-2">Biodegradable materials that can decompose naturally:</p>
                <ul class="text-sm space-y-1 ml-4 list-disc list-inside">
                  <li>Fruit and vegetable scraps</li>
                  <li>Yard trimmings (leaves, grass clippings)</li>
                  <li>Coffee grounds and tea leaves</li>
                  <li>Eggshells and nutshells</li>
                </ul>
                <p class="text-xs text-green-600 mt-2 font-medium">Tip: Composting reduces landfill waste by up to 30%.</p>
              </div>
              
              <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 class="font-semibold text-red-700 mb-2">🔴 Hazardous Waste</h4>
                <p class="text-sm mb-2">Materials that pose risks to health or environment:</p>
                <ul class="text-sm space-y-1 ml-4 list-disc list-inside">
                  <li>Batteries (all types)</li>
                  <li>Electronics and e-waste</li>
                  <li>Chemicals and cleaning products</li>
                  <li>Paint and solvents</li>
                  <li>Fluorescent bulbs and CFLs</li>
                </ul>
                <p class="text-xs text-red-600 mt-2 font-medium">Warning: Never dispose of these in regular trash.</p>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
                <h4 class="font-semibold text-gray-700 mb-2">⚫ General/Residual Waste</h4>
                <p class="text-sm mb-2">Non-recyclable materials that go to landfills:</p>
                <ul class="text-sm space-y-1 ml-4 list-disc list-inside">
                  <li>Contaminated packaging</li>
                  <li>Ceramics and porcelain</li>
                  <li>Mirrors and window glass</li>
                  <li>Certain plastics (check local guidelines)</li>
                </ul>
                <p class="text-xs text-gray-600 mt-2 font-medium">Goal: Minimize this category through better choices.</p>
              </div>
            </div>
          `
        },
        {
          title: "The 3 R's Principle",
          content: `
            <h3 class="text-xl font-bold mb-4 text-green-700">Reduce, Reuse, Recycle</h3>
            <p class="text-gray-700 mb-6">The 3 R's hierarchy prioritizes waste prevention over disposal. Each step becomes progressively less effective at minimizing environmental impact.</p>
            
            <div class="space-y-6">
              <div class="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg">
                <h4 class="font-bold text-red-700 mb-3 flex items-center">
                  <span class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">1</span>
                  REDUCE - Most Effective
                </h4>
                <p class="text-sm mb-3">Minimize waste generation at the source. This is the most impactful action you can take.</p>
                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 class="font-medium mb-2 text-red-600">Smart Purchasing:</h5>
                    <ul class="text-sm space-y-1 list-disc list-inside">
                      <li>Buy only what you need</li>
                      <li>Choose products with minimal packaging</li>
                      <li>Select durable, long-lasting items</li>
                      <li>Avoid single-use items</li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="font-medium mb-2 text-red-600">Digital Solutions:</h5>
                    <ul class="text-sm space-y-1 list-disc list-inside">
                      <li>Use electronic receipts</li>
                      <li>Go paperless for bills</li>
                      <li>Use cloud storage</li>
                      <li>Read news online</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg">
                <h4 class="font-bold text-yellow-700 mb-3 flex items-center">
                  <span class="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">2</span>
                  REUSE - Creative Repurposing
                </h4>
                <p class="text-sm mb-3">Find new purposes for items before discarding them. Creativity is your best tool here.</p>
                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 class="font-medium mb-2 text-yellow-600">Household Items:</h5>
                    <ul class="text-sm space-y-1 list-disc list-inside">
                      <li>Glass jars → storage containers</li>
                      <li>Old clothes → cleaning rags</li>
                      <li>Cardboard boxes → organizers</li>
                      <li>Plastic containers → planters</li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="font-medium mb-2 text-yellow-600">Community Sharing:</h5>
                    <ul class="text-sm space-y-1 list-disc list-inside">
                      <li>Donate items in good condition</li>
                      <li>Gift unwanted items to friends</li>
                      <li>Use community swap groups</li>
                      <li>Participate in tool libraries</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                <h4 class="font-bold text-green-700 mb-3 flex items-center">
                  <span class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">3</span>
                  RECYCLE - Last Resort
                </h4>
                <p class="text-sm mb-3">Process materials to create new products. While important, recycling uses energy and isn't 100% efficient.</p>
                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 class="font-medium mb-2 text-green-600">Best Practices:</h5>
                    <ul class="text-sm space-y-1 list-disc list-inside">
                      <li>Clean containers thoroughly</li>
                      <li>Remove caps and lids (if required)</li>
                      <li>Separate materials properly</li>
                      <li>Follow local guidelines</li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="font-medium mb-2 text-green-600">Know Your Numbers:</h5>
                    <ul class="text-sm space-y-1 list-disc list-inside">
                      <li>Plastic #1, #2: Most recyclable</li>
                      <li>Plastic #3-#7: Check locally</li>
                      <li>Paper: Remove staples/clips</li>
                      <li>Glass: All colors accepted</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-700 mb-2">💡 Remember the Hierarchy</h4>
              <p class="text-sm">Always prioritize in this order: Reduce first, then Reuse, and finally Recycle. Each step up the hierarchy saves more energy and resources.</p>
            </div>
          `
        },
        {
          title: "Sorting Systems & Best Practices",
          content: `
            <h3 class="text-xl font-bold mb-4 text-green-700">Effective Waste Sorting Systems</h3>
            <p class="text-gray-700 mb-6">A well-organized sorting system makes waste management effortless and ensures materials reach their proper destination.</p>
            
            <div class="space-y-6">
              <div class="bg-white border-2 border-blue-200 rounded-lg p-6">
                <h4 class="font-bold text-blue-700 mb-4">🏠 Home Sorting Setup</h4>
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 class="font-semibold mb-3 text-blue-600">Kitchen Station:</h5>
                    <ul class="text-sm space-y-2">
                      <li class="flex items-start">
                        <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded mr-2 mt-0.5">TIP</span>
                        <span>Use separate containers for organics and recycling under the sink</span>
                      </li>
                      <li class="flex items-start">
                        <span class="bg-green-500 text-white text-xs px-2 py-1 rounded mr-2 mt-0.5">TIP</span>
                        <span>Keep a small container on the counter for food scraps</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="font-semibold mb-3 text-blue-600">Garage/Utility Area:</h5>
                    <ul class="text-sm space-y-2 list-disc list-inside">
                      <li>Larger bins for different material types</li>
                      <li>Dedicated area for hazardous items</li>
                      <li>Clear labeling system with colors</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="bg-white border-2 border-orange-200 rounded-lg p-6">
                <h4 class="font-bold text-orange-700 mb-4">⚠️ Common Sorting Mistakes</h4>
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 class="font-semibold text-red-600 mb-3">❌ Avoid These:</h5>
                    <ul class="text-sm space-y-1 list-disc list-inside">
                      <li>Pizza boxes with grease stains</li>
                      <li>Plastic bags in recycling bins</li>
                      <li>Broken glass in regular recycling</li>
                      <li>Electronics in general waste</li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="font-semibold text-green-600 mb-3">✅ Do This Instead:</h5>
                    <ul class="text-sm space-y-1 list-disc list-inside">
                      <li>Clean pizza boxes or compost them</li>
                      <li>Return plastic bags to store collection</li>
                      <li>Wrap broken glass safely for general waste</li>
                      <li>Take electronics to e-waste centers</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    {
      id: 1,
      title: "Composting & Organic Waste",
      icon: <Leaf className="w-6 h-6" />,
      duration: "20 min",
      lessons: [
        {
          title: "Introduction to Composting",
          content: `
            <h3 class="text-xl font-bold mb-4 text-green-700">What is Composting?</h3>
            <p class="text-gray-700 mb-6">Composting is nature's recycling process where organic materials decompose into nutrient-rich soil amendment through the action of beneficial microorganisms.</p>
            
            <div class="space-y-6">
              <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                <h4 class="font-semibold text-green-700 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 01-1.022.547m14.456 0a4.5 4.5 0 01-8.91 0m8.91 0a4.5 4.5 0 00-8.91 0m0 0l-.318.158a6 6 0 00-3.86.517l-2.387.477a2 2 0 00-1.022.547M12 12V9m0 3H9m3 0h3m-3 0V6.172a3 3 0 01.879-2.121L12 2l.879 2.051a3 3 0 01.879 2.121V12m-6 0h12" /></svg>
                  The Science Behind Composting
                </h4>
                <p class="text-sm mb-4">Composting is an aerobic process where bacteria, fungi, and other microorganisms break down organic matter in the presence of oxygen. This biological decomposition transforms waste into humus, a dark, earthy-smelling material rich in nutrients.</p>
              </div>

              <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h4 class="font-semibold text-blue-700 mb-3">🌍 Environmental Benefits</h4>
                  <ul class="text-sm space-y-2 list-disc list-inside">
                    <li><strong>Reduces landfill waste:</strong> Up to 30% of household waste can be composted</li>
                    <li><strong>Decreases methane emissions:</strong> Prevents anaerobic decomposition in landfills</li>
                    <li><strong>Improves soil health:</strong> Adds beneficial microorganisms and nutrients</li>
                    <li><strong>Reduces erosion:</strong> Improves soil structure and water retention</li>
                  </ul>
                </div>
                
                <div class="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <h4 class="font-semibold text-purple-700 mb-3">💰 Personal Benefits</h4>
                  <ul class="text-sm space-y-2 list-disc list-inside">
                      <li><strong>Free fertilizer:</strong> Rich compost for gardens and houseplants</li>
                      <li><strong>Reduced waste costs:</strong> Lower garbage collection fees</li>
                      <li><strong>Educational value:</strong> Teaching tool for children about nature cycles</li>
                      <li><strong>Satisfaction:</strong> Visible impact on environmental stewardship</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        },
        {
          title: "Compostable Materials Guide",
          content: `
            <h3 class="text-xl font-bold mb-4 text-green-700">What Can and Cannot Be Composted</h3>
            <p class="text-gray-700 mb-6">Success in composting depends on choosing the right materials and maintaining proper balance between nitrogen-rich "greens" and carbon-rich "browns".</p>
            
            <div class="grid md:grid-cols-2 gap-6 mb-8">
              <div class="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <h4 class="font-bold text-green-700 mb-4 flex items-center">
                  <div class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">N</div>
                  GREENS (Nitrogen-Rich)
                </h4>
                <p class="text-sm text-green-600 mb-4">High in nitrogen, these materials provide protein for microorganisms and create heat in the compost pile.</p>
                <ul class="text-sm space-y-1 list-disc list-inside">
                  <li>Vegetable and fruit peels, cores, rinds</li>
                  <li>Coffee grounds and paper filters</li>
                  <li>Fresh grass clippings (thin layers only)</li>
                  <li>Weeds without seeds</li>
                </ul>
              </div>
              
              <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
                <h4 class="font-bold text-yellow-700 mb-4 flex items-center">
                  <div class="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">C</div>
                  BROWNS (Carbon-Rich)
                </h4>
                <p class="text-sm text-yellow-600 mb-4">High in carbon, these materials provide energy for microorganisms and create structure in the compost pile.</p>
                <ul class="text-sm space-y-1 list-disc list-inside">
                  <li>Shredded newspaper (avoid glossy inserts)</li>
                  <li>Cardboard (small pieces, remove tape)</li>
                  <li>Dried leaves (excellent carbon source)</li>
                  <li>Small wood chips and sawdust</li>
                </ul>
              </div>
            </div>
            
            <div class="bg-red-50 p-6 rounded-lg border-2 border-red-200 mb-6">
              <h4 class="font-bold text-red-700 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                DO NOT COMPOST - Harmful Materials
              </h4>
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 class="font-semibold text-red-600 mb-3">⚠️ Health & Safety Risks:</h5>
                  <ul class="text-sm space-y-1 list-disc list-inside">
                    <li>Meat, fish, and poultry scraps</li>
                    <li>Dairy products (milk, cheese, yogurt)</li>
                    <li>Oils, fats, and grease</li>
                    <li>Pet waste (dogs, cats)</li>
                    <li>Diseased or pest-infested plants</li>
                  </ul>
                </div>
                <div>
                  <h5 class="font-semibold text-red-600 mb-3">🚫 Contamination Risks:</h5>
                  <ul class="text-sm space-y-1 list-disc list-inside">
                    <li>Weeds with seeds or runners</li>
                    <li>Treated or pressure-treated wood</li>
                    <li>Coal or charcoal ash</li>
                    <li>Glossy or coated paper</li>
                    <li>Synthetic materials</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        },
        {
          title: "Composting Methods & Setup",
          content: `
            <h3 class="text-xl font-bold mb-4 text-green-700">Choosing Your Composting Method</h3>
            <p class="text-gray-700 mb-6">Different composting methods suit different lifestyles, spaces, and time commitments. Choose the approach that works best for your situation.</p>
            
            <div class="space-y-6">
              <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <h4 class="font-bold text-green-700 mb-4">🏡 Backyard Composting Systems</h4>
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="bg-white p-4 rounded-lg border border-green-100">
                    <h5 class="font-semibold text-green-600 mb-3">🔄 Tumbler Composter</h5>
                    <div class="text-sm space-y-2">
                      <p><strong>Best for:</strong> Quick results, easy turning</p>
                      <p><strong>Pros:</strong> Pest-resistant, weather-protected</p>
                      <p><strong>Cons:</strong> Limited capacity, requires purchase</p>
                    </div>
                  </div>
                  
                  <div class="bg-white p-4 rounded-lg border border-green-100">
                    <h5 class="font-semibold text-green-600 mb-3">📦 Bin System</h5>
                    <div class="text-sm space-y-2">
                      <p><strong>Best for:</strong> Large families, continuous composting</p>
                      <p><strong>Pros:</strong> Expandable, cost-effective, high capacity</p>
                      <p><strong>Cons:</strong> Requires more space, manual turning</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 class="font-bold text-blue-700 mb-4">🏢 Small Space & Indoor Solutions</h4>
                 <div class="grid md:grid-cols-2 gap-4">
                     <div class="bg-white p-4 rounded-lg">
                       <h5 class="font-semibold text-blue-600 mb-2">🪱 Vermicomposting (Worm Bin)</h5>
                       <p class="text-xs">Uses worms to break down food scraps into very high-quality compost.</p>
                     </div>
                    <div class="bg-white p-4 rounded-lg">
                       <h5 class="font-semibold text-blue-600 mb-2">🥬 Bokashi Method</h5>
                       <p class="text-xs">A fermentation-based system using beneficial microbes in an airtight container.</p>
                    </div>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    {
      id: 2,
      title: "Hazardous Waste Management",
      icon: <AlertTriangle className="w-6 h-6" />,
      duration: "18 min",
      lessons: [
        {
          title: "Identifying Hazardous Waste",
          content: `
            <h3 class="text-xl font-bold mb-4 text-red-700">Understanding Hazardous Waste</h3>
            <p class="text-gray-700 mb-6">Hazardous waste contains toxic, corrosive, flammable, or reactive substances that can harm human health and the environment. Proper identification is the first step in safe management.</p>
            
            <div class="space-y-6">
              <div class="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                <h4 class="font-bold text-red-700 mb-3">Why It Matters</h4>
                <p class="text-red-800">When hazardous materials enter regular waste streams, they can contaminate soil, groundwater, and air, posing risks to waste management workers and causing long-term environmental damage.</p>
              </div>
              
              <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <h4 class="font-semibold text-orange-700 mb-4">⚡ Electronic Waste (E-Waste)</h4>
                  <p class="text-sm text-orange-600 mb-3">Contains valuable materials but also toxic substances like lead, mercury, and cadmium.</p>
                  <ul class="text-sm space-y-1 list-disc list-inside">
                    <li>Smartphones, tablets, laptops</li>
                    <li>Computers and monitors</li>
                    <li>Televisions and audio equipment</li>
                    <li>All types of batteries</li>
                    <li>Chargers and cables</li>
                    <li>LED and CFL light bulbs</li>
                  </ul>
                </div>
                
                <div class="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <h4 class="font-semibold text-purple-700 mb-4">🧪 Chemical & Household Hazards</h4>
                  <p class="text-sm text-purple-600 mb-3">Common products that become hazardous waste when disposed of improperly.</p>
                  <ul class="text-sm space-y-1 list-disc list-inside">
                    <li>Oven cleaners, drain cleaners</li>
                    <li>Motor oil, antifreeze</li>
                    <li>Paint, stain, and varnish</li>
                    <li>Pesticides and herbicides</li>
                    <li>Propane tanks</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        },
        {
          title: "Safe Disposal Methods",
          content: `
            <h3 class="text-xl font-bold mb-4 text-red-700">Proper Disposal Practices</h4>
            <p class="text-gray-700 mb-6">Safe disposal of hazardous materials requires specialized facilities and procedures. Never attempt to dispose of these materials in regular trash or down drains.</p>
            
            <div class="space-y-6">
              <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <h4 class="font-bold text-blue-700 mb-4">🏢 Community Collection Facilities</h4>
                <p class="text-sm text-blue-600 mb-4">Most communities provide specialized facilities for safe hazardous waste disposal, staffed by trained professionals.</p>
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="bg-white p-4 rounded-lg border border-blue-100">
                    <h5 class="font-semibold text-blue-600 mb-3">🏛️ Household Hazardous Waste (HHW) Centers</h5>
                    <p class="text-sm">Contact your city hall or waste management department to find your local permanent facility. They accept paint, chemicals, e-waste, and more.</p>
                  </div>
                  <div class="bg-white p-4 rounded-lg border border-blue-100">
                    <h5 class="font-semibold text-blue-600 mb-3">📅 Special Collection Events</h5>
                    <p class="text-sm">Many communities host periodic collection events, like spring cleanups or mobile drop-off days, for convenient disposal.</p>
                  </div>
                </div>
              </div>

              <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                <h4 class="font-bold text-green-700 mb-4">📦 Mail-Back & Take-Back Programs</h4>
                <p class="text-sm text-green-600 mb-4">For specific items, these programs offer a convenient and safe disposal method without leaving your home.</p>
                 <div class="grid md:grid-cols-2 gap-4">
                  <div class="bg-white p-3 rounded-lg"><h5 class="font-semibold text-green-600">Ink Cartridges:</h5><p class="text-xs">Most manufacturers provide prepaid mailers to return used cartridges.</p></div>
                  <div class="bg-white p-3 rounded-lg"><h5 class="font-semibold text-green-600">Batteries & Bulbs:</h5><p class="text-xs">Many retailers and manufacturers offer mail-in recycling kits.</p></div>
                </div>
              </div>

              <div class="bg-red-50 p-6 rounded-lg border-l-4 border-red-500 mt-6">
                <h4 class="font-bold text-red-700 mb-3 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Critical Disposal "Don'ts"
                </h4>
                <div class="space-y-2">
                  <p class="text-sm text-red-800"><strong>❌ NEVER</strong> pour hazardous waste down the drain, toilet, or storm sewer.</p>
                  <p class="text-sm text-red-800"><strong>❌ NEVER</strong> mix different hazardous chemicals together.</p>
                  <p class="text-sm text-red-800"><strong>❌ NEVER</strong> place hazardous materials in your regular trash or recycling bins.</p>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    {
      id: 3,
      title: "Waste Reduction & Final Quiz",
      icon: <Trash2 className="w-6 h-6" />,
      duration: "10 min",
      lessons: [
        {
          title: "Zero Waste Philosophy",
          content: `
            <h3 class="text-xl font-bold mb-4 text-green-700">Adopting a Zero Waste Lifestyle</h3>
            <p class="text-gray-700 mb-6">Zero waste is a philosophy that encourages the redesign of resource life cycles so that all products are reused. The goal is for no trash to be sent to landfills, incinerators, or the ocean.</p>
            
            <div class="space-y-6">
                <div class="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-200">
                    <h4 class="font-bold text-teal-700 mb-4">Beyond the 3 R's: The 5 R's of Zero Waste</h4>
                    <ol class="space-y-3">
                        <li class="flex items-start"><strong class="mr-2 text-teal-600">1. Refuse:</strong> Say no to what you don't need (e.g., freebies, plastic straws, junk mail).</li>
                        <li class="flex items-start"><strong class="mr-2 text-teal-600">2. Reduce:</strong> Minimize what you do need and consume.</li>
                        <li class="flex items-start"><strong class="mr-2 text-teal-600">3. Reuse:</strong> Repurpose items and choose durable over disposable.</li>
                        <li class="flex items-start"><strong class="mr-2 text-teal-600">4. Recycle:</strong> Properly process what you cannot refuse, reduce, or reuse.</li>
                        <li class="flex items-start"><strong class="mr-2 text-teal-600">5. Rot:</strong> Compost the rest (organic materials).</li>
                    </ol>
                </div>

                <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <h4 class="font-semibold text-yellow-700 mb-4">Practical Steps to Reduce Waste</h4>
                    <div class="grid md:grid-cols-2 gap-4 text-sm">
                        <ul class="space-y-2 list-disc list-inside">
                            <li>Carry reusable shopping bags, water bottles, and coffee cups.</li>
                            <li>Buy in bulk to reduce packaging.</li>
                            <li>Choose glass, metal, or wood over plastic.</li>
                            <li>Learn basic repair skills for clothing and electronics.</li>
                        </ul>
                        <ul class="space-y-2 list-disc list-inside">
                            <li>Shop at farmers' markets to avoid plastic-wrapped produce.</li>
                            <li>Make your own cleaning supplies.</li>
                            <li>Cancel unnecessary subscriptions and mailings.</li>
                            <li>Borrow or rent items used infrequently.</li>
                        </ul>
                    </div>
                </div>
            </div>
          `
        },
        {
          title: "Final Quiz",
          content: `<p>Test your knowledge!</p>`
        }
      ]
    }
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      question: "Which of the '3 R's' is the MOST effective way to manage waste?",
      options: ["Recycle", "Reuse", "Reduce", "Repurpose"],
      correctAnswer: 2,
      explanation: "Reduce is the most effective because it prevents waste from being created in the first place, saving the most resources."
    },
    {
      question: "Which of the following items should NOT be placed in a backyard compost bin?",
      options: ["Coffee grounds", "Dried leaves", "Meat scraps", "Vegetable peels"],
      correctAnswer: 2,
      explanation: "Meat scraps should not be composted at home as they can attract pests and create harmful pathogens."
    },
    {
      question: "What is the best way to dispose of old electronics like a smartphone?",
      options: ["Put it in the regular trash", "Take it to an e-waste recycling center", "Bury it in the yard", "Put it in the recycling bin"],
      correctAnswer: 1,
      explanation: "Electronics are hazardous waste and must be taken to a specialized e-waste facility for safe recycling."
    },
    {
      question: "What is the ideal ratio of 'Browns' (Carbon) to 'Greens' (Nitrogen) in a compost pile?",
      options: ["1 part Brown to 3 parts Green", "Equal parts Brown and Green", "3 parts Brown to 1 part Green", "10 parts Brown to 1 part Green"],
      correctAnswer: 2,
      explanation: "The ideal ratio is roughly 3 parts 'browns' (carbon) to 1 part 'greens' (nitrogen) by volume to ensure efficient decomposition."
    }
  ];

  const isQuiz = currentModule === trainingModules.length - 1 && currentLesson === trainingModules[currentModule].lessons.length - 1;

  useEffect(() => {
    if (!isQuiz) {
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  }, [currentModule, currentLesson, isQuiz]);

  const handleModuleSelect = (moduleId: number) => {
    setCurrentModule(moduleId);
    setCurrentLesson(0);
  };

  const handleLessonSelect = (lessonIndex: number) => {
    setCurrentLesson(lessonIndex);
  };

  const handleNext = () => {
    const currentModuleLessons = trainingModules[currentModule].lessons;
    if (currentLesson < currentModuleLessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else if (currentModule < trainingModules.length - 1) {
      setCurrentModule(currentModule + 1);
      setCurrentLesson(0);
    }
  };

  const handlePrev = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    } else if (currentModule > 0) {
      const prevModuleLessons = trainingModules[currentModule - 1].lessons;
      setCurrentModule(currentModule - 1);
      setCurrentLesson(prevModuleLessons.length - 1);
    }
  };

  const handleFinalClick = () => {
    if (isLastLesson) {
      router.push("/"); 
    } else {
      handleNext();
    }
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers({
      ...quizAnswers,
      [questionIndex]: answerIndex,
    });
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
  };

  const getQuizScore = () => {
    return quizQuestions.reduce((score, question, index) => {
      return score + (quizAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
  };

  const isFirstLesson = currentModule === 0 && currentLesson === 0;
  const isLastLesson = currentModule === trainingModules.length - 1 && currentLesson === trainingModules[currentModule].lessons.length - 1;

  const totalLessons = trainingModules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessons = trainingModules.slice(0, currentModule).reduce((acc, module) => acc + module.lessons.length, 0) + currentLesson + 1;
  const overallProgress = (completedLessons / totalLessons) * 100;

  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-green-800">Waste Management Training</h1>
          <p className="text-gray-600 mt-2">Your guide to sustainable waste practices at home and in the workplace.</p>
        </header>

        <div className="flex flex-col gap-8">
          <div className="w-full bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center sm:text-left">Training Modules</h2>
            <nav className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-4">
              {trainingModules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => handleModuleSelect(module.id)}
                  className={`flex items-center text-left p-3 rounded-md transition-colors duration-200 text-sm md:text-base ${currentModule === module.id
                      ? 'bg-green-100 text-green-800 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <span className={currentModule === module.id ? 'text-green-600' : 'text-gray-400'}>{module.icon}</span>
                  <span className="ml-2">{module.title}</span>
                </button>
              ))}
            </nav>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${overallProgress}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">{Math.round(overallProgress)}% Complete</p>
            </div>
          </div>


          <main className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 md:p-8 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{trainingModules[currentModule].title}</h2>
                  <div className="flex items-center text-sm text-gray-500 mt-2 flex-wrap">
                    <div className="flex items-center mr-4 mb-2 md:mb-0">
                      <Book className="w-4 h-4 mr-2" />
                      <span>Lesson {currentLesson + 1} of {trainingModules[currentModule].lessons.length}</span>
                    </div>
                    <div className="flex items-center mb-2 md:mb-0">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Module duration: {trainingModules[currentModule].duration}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                {trainingModules[currentModule].lessons.map((lesson, index) => (
                  <button
                    key={index}
                    onClick={() => handleLessonSelect(index)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${currentLesson === index ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    {lesson.title}
                  </button>
                ))}
              </div>
            </div>
            <article className="p-6 md:p-8 prose max-w-none">
              {isQuiz ? (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-green-700">Final Quiz</h3>
                  <div className="space-y-8">
                    {quizQuestions.map((q, qIndex) => (
                      <div key={qIndex}>
                        <p className="font-semibold mb-4">{qIndex + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((option, oIndex) => {
                            const isSelected = quizAnswers[qIndex] === oIndex;
                            const isCorrect = q.correctAnswer === oIndex;
                            let buttonClass = 'border-gray-300 hover:bg-gray-100';
                            if (quizSubmitted) {
                              if (isCorrect) {
                                buttonClass = 'bg-green-100 border-green-400 text-green-800';
                              } else if (isSelected && !isCorrect) {
                                buttonClass = 'bg-red-100 border-red-400 text-red-800';
                              }
                            } else if (isSelected) {
                              buttonClass = 'bg-blue-100 border-blue-400';
                            }

                            return (
                              <button
                                key={oIndex}
                                onClick={() => handleQuizAnswer(qIndex, oIndex)}
                                disabled={quizSubmitted}
                                className={`w-full text-left p-3 border rounded-md transition-colors ${buttonClass}`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {quizSubmitted && (
                          <div className={`mt-3 p-3 rounded-lg text-sm ${quizAnswers[qIndex] === q.correctAnswer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {!quizSubmitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(quizAnswers).length !== quizQuestions.length}
                      className="mt-8 px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-xl font-bold text-blue-800">Quiz Complete!</h4>
                      <p className="text-lg mt-2">You scored: <strong className="text-2xl">{getQuizScore()} / {quizQuestions.length}</strong></p>
                      {getQuizScore() === quizQuestions.length && <p className="mt-2 text-green-700 font-semibold">Excellent work! You're a waste management expert!</p>}
                    </div>
                  )}
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: trainingModules[currentModule].lessons[currentLesson].content }} />
              )}
            </article>
            <footer className="p-6 border-t flex justify-between items-center bg-gray-50">
              <button
                onClick={handlePrev}
                disabled={isFirstLesson}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={handleFinalClick}
                disabled={isLastLesson && !quizSubmitted}
                className="px-5 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastLesson ? 'Finish Training' : 'Next Lesson'}
              </button>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default WasteManagementTraining;