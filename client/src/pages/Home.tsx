import AiFinderBand from './home/AiFinderBand';
import CategoriesSection from './home/CategoriesSection';
import FeaturedSection from './home/FeaturedSection';
import Hero from './home/Hero';
import HowItWorks from './home/HowItWorks';
import OwnerCta from './home/OwnerCta';

export default function Home() {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <FeaturedSection />
      <HowItWorks />
      <AiFinderBand />
      <OwnerCta />
    </>
  );
}
