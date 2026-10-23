import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import { BenefitsSection, CoverageSection, HowItWorksSection, FAQSection, FinalCTA } from '@/components/sections/ContentSections';
import PremiumCalculator from '@/components/calculator/PremiumCalculator';
export default function Home() { return <><Navbar/><main id="main"><HeroSection/><PremiumCalculator/><BenefitsSection/><CoverageSection/><HowItWorksSection/><FAQSection/><FinalCTA/></main><Footer/></>; }
