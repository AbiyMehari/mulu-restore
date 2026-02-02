import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Mulu ReStore Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-2xl font-bold text-green-800">
                Mulu ReStore
              </span>
            </Link>
            <div className="flex gap-6">
              <Link href="/products" className="text-gray-700 hover:text-green-700 transition-colors">
                Products
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-green-700 transition-colors">
                Cart
              </Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-green-700 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Mulu ReStore
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-4 font-medium">
            Intercultural. Sustainable. Connected.
          </p>
          <p className="text-lg text-gray-600 mb-8">
            German craftsmanship meets Ethiopian cultural heritage
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/products"
              className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Shop Now
            </Link>
            <Link
              href="#about"
              className="bg-white text-green-700 px-8 py-3 rounded-lg font-semibold border-2 border-green-700 hover:bg-green-50 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">🌿 About Us</h2>
            <div className="w-24 h-1 bg-green-700 mx-auto"></div>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p className="text-xl leading-relaxed">
              <strong className="text-green-800">Mulu ReStore</strong> combines German craftsmanship with Ethiopian cultural heritage – driven by a shared vision of sustainability, fairness, and cultural exchange. Together with our customers and supporters, we want to show that sustainable consumption can be different: resource-efficient, socially responsible, and meaningful.
            </p>

            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-700 my-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Workshop</h3>
              <p className="leading-relaxed">
                In our workshop, old, antique, and vintage furniture is given a new lease on life. With attention to detail, skilled craftsmanship, and respect for the history of each piece, we create sustainable, one-of-a-kind items that connect the past and present. Furthermore, people can donate their well-preserved small furniture and home accessories to become part of this cycle.
              </p>
            </div>

            <p className="leading-relaxed">
              A portion of our profits goes to <strong className="text-green-800">Enat Ethiopia eV</strong>, which supports projects in education, agriculture, and sustainable development in Ethiopia. This creates a link between local craftsmanship and global responsibility.
            </p>

            <div className="bg-amber-50 p-6 rounded-lg border-l-4 border-amber-600 my-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Roots</h3>
              <p className="leading-relaxed">
                Mulu ReStore builds on our long-standing work in Ethiopia, where we partnered with a farming community to establish the <a href="https://mululodge.com" target="_blank" rel="noopener noreferrer" className="text-amber-800 font-semibold hover:text-amber-900 underline">Mulu Eco Lodge</a> – a United Nations-awarded project for sustainable regional development. We promote traditional Ethiopian craftsmanship and source products directly and fairly from cooperatives and workshops, ensuring that the added value directly benefits local communities.
              </p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-600 my-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Intercultural Platform</h3>
              <p className="leading-relaxed">
                Furthermore, Mulu ReStore serves as an intercultural platform: through events featuring Ethiopian musicians, dancers, and artists, we create spaces for encounters and mutual understanding – a vibrant dialogue between cultures.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600 my-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h3>
              <p className="leading-relaxed">
                With my background in sustainability science, each of our projects is driven by a genuine, lived commitment to sustainability – not as a trend, but out of conviction, to leave our children a healthy and just world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <div className="w-24 h-1 bg-green-700 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sustainability</h3>
              <p className="text-gray-600">
                Resource-efficient, socially responsible, and meaningful consumption that respects our planet.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fairness</h3>
              <p className="text-gray-600">
                Direct and fair sourcing from cooperatives and workshops, ensuring added value benefits local communities.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cultural Exchange</h3>
              <p className="text-gray-600">
                Creating spaces for encounters and mutual understanding between cultures through art and craftsmanship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Discover Sustainable Furniture?</h2>
          <p className="text-xl mb-8 text-green-100">
            Browse our curated collection of restored vintage furniture and unique pieces
          </p>
          <Link
            href="/products"
            className="inline-block bg-white text-green-800 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-lg hover:shadow-xl"
          >
            Explore Products
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/logo.png"
                  alt="Mulu ReStore Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <h3 className="text-xl font-bold text-white">Mulu ReStore</h3>
              </div>
              <p className="text-sm">
                Intercultural. Sustainable. Connected.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/products" className="hover:text-green-400 transition-colors">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-green-400 transition-colors">
                    Cart
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="hover:text-green-400 transition-colors">
                    My Orders
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <p className="text-sm">
                A portion of our profits supports Enat Ethiopia eV projects in education, agriculture, and sustainable development.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Mulu ReStore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
