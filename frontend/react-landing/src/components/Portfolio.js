import React from 'react';

const Portfolio = ({ onGetStarted }) => {
  const projects = [
    {
      icon: (
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ),
      title: "Bulk Upload System",
      description: "Upload your entire phone gallery at once. Our AI processes everything automatically, analyzing content and generating intelligent tags for seamless organization."
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      ),
      title: "Semantic Search Engine",
      description: "Search by meaning: \"show me all the times I was happy\" or \"find my beach memories\". Our AI understands context, emotions, and concepts beyond keywords."
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      title: "AI Story Generation",
      description: "Transform scattered memories into cohesive, uplifting narratives that celebrate the best moments of your life. Create beautiful \"Footage Flow\" stories with AI."
    }
  ];

  return (
    <section id="portfolio" className="py-20 bg-secondary-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-section font-extrabold text-black slide-up">
            Core Features
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mt-4 slide-up" style={{animationDelay: '0.2s'}}>
            Discover the powerful AI technologies that make Footage Flow the ultimate video search and story creation platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {projects.map((project, index) => (
            <div key={index} className="card slide-up" style={{animationDelay: `${0.4 + index * 0.2}s`}}>
              <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-6 text-black scale-in" style={{animationDelay: `${0.6 + index * 0.2}s`}}>
                {project.icon}
              </div>
              <h3 className="text-xl font-semibold text-black mb-4">
                {project.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {project.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-20">
          <div className="bg-gradient-to-b from-[#E9F1FA] to-white inline-block rounded-2xl px-8 py-10 border border-[#DDEBFA] shadow">
            <h3 className="text-2xl font-extrabold text-[#0D1B2A] mb-2">Ready to turn your memories into stories?</h3>
            <p className="text-[#0D1B2A]/70 mb-6 max-w-2xl">
              Sign in and let Footage Flow organize your moments, search by meaning, and craft beautiful narratives—automatically.
            </p>
            <button onClick={onGetStarted} className="px-6 py-3 rounded-xl bg-[#00ABE4] text-white font-semibold shadow hover:opacity-90 inline-block">Login and get started</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
