import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Layered Depth */}
      <section className="relative overflow-hidden border-b-4 border-border">
        {/* Background layers for depth */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,var(--muted)_20px,var(--muted)_40px)] opacity-30" />
        <div className="absolute top-20 -left-10 w-72 h-72 bg-secondary border-4 border-border rotate-12 -z-10" />
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-primary border-4 border-border -rotate-6 -z-10" />
        
        <div className="relative container mx-auto px-6 py-24 md:py-32">
          <Badge className="mb-6 text-base px-4 py-2 shadow-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            Neo Brutalism
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-6 max-w-4xl">
            Design with{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Depth</span>
              <span className="absolute inset-0 bg-secondary -rotate-1 -z-10 translate-x-2 translate-y-2" />
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl max-w-2xl mb-10 font-medium leading-relaxed">
            Bold shadows, stark contrasts, and layered elements create a powerful visual hierarchy.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Stacked Cards Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black uppercase mb-12">
          Layered Components
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card Stack 1 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary border-4 border-border translate-x-4 translate-y-4 transition-transform group-hover:translate-x-6 group-hover:translate-y-6" />
            <Card className="relative border-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-2xl font-black uppercase">Bold Shadows</CardTitle>
                <CardDescription className="text-base">
                  Hard-edged shadows create physical presence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>No soft glows here. Every element casts a solid, assertive shadow that grounds it in space.</p>
              </CardContent>
            </Card>
          </div>

          {/* Card Stack 2 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-secondary border-4 border-border translate-x-4 translate-y-4 transition-transform group-hover:translate-x-6 group-hover:translate-y-6" />
            <Card className="relative border-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-2xl font-black uppercase">High Contrast</CardTitle>
                <CardDescription className="text-base">
                  Black borders define every shape
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Thick borders and stark color contrasts make interfaces feel tangible and direct.</p>
              </CardContent>
            </Card>
          </div>

          {/* Card Stack 3 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-accent border-4 border-border translate-x-4 translate-y-4 transition-transform group-hover:translate-x-6 group-hover:translate-y-6" />
            <Card className="relative border-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-2xl font-black uppercase">Raw Energy</CardTitle>
                <CardDescription className="text-base">
                  Unapologetically bold design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Neo brutalism embraces imperfection and rawness, rejecting polished minimalism.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Offset Grid Section */}
      <section className="bg-muted border-y-4 border-border">
        <div className="container mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-12">
            Visual Hierarchy
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Stacked boxes illustration */}
            <div className="relative h-80">
              <div className="absolute top-0 left-0 w-48 h-48 bg-secondary border-4 border-border shadow-xl" />
              <div className="absolute top-12 left-16 w-48 h-48 bg-primary border-4 border-border shadow-xl" />
              <div className="absolute top-24 left-32 w-48 h-48 bg-accent border-4 border-border shadow-xl" />
              <div className="absolute top-36 left-48 w-48 h-48 bg-card border-4 border-border shadow-xl flex items-center justify-center">
                <span className="font-black text-4xl">DEPTH</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-black uppercase mb-4">
                Layers Create Meaning
              </h3>
              <p className="text-lg mb-6 leading-relaxed">
                By stacking elements with hard shadows and bold borders, we create a sense of physical depth that guides the user&apos;s attention through the interface.
              </p>
              <ul className="space-y-3">
                {["Offset shadows", "Stacked elements", "Bold borders", "High contrast colors"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-primary border-2 border-border" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with floating elements */}
      <section className="relative container mx-auto px-6 py-24">
        {/* Floating decorative elements */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-secondary border-4 border-border rotate-12 hidden md:block" />
        <div className="absolute bottom-20 left-10 w-16 h-16 bg-primary border-4 border-border -rotate-6 hidden md:block" />
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-accent border-4 border-border rotate-45 hidden md:block" />
        
        <div className="relative bg-card border-4 border-border p-12 shadow-2xl max-w-3xl mx-auto">
          {/* Offset background for depth */}
          <div className="absolute inset-0 bg-border translate-x-3 translate-y-3 -z-10" />
          
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-4 text-center">
            Ready to Build?
          </h2>
          <p className="text-lg text-center mb-8 max-w-xl mx-auto">
            Start creating bold, impactful interfaces with depth and character.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button size="lg" className="shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              Start Building
            </Button>
            <Button size="lg" variant="secondary" className="shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
              View Examples
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-border bg-muted">
        <div className="container mx-auto px-6 py-8">
          <p className="font-bold text-center uppercase tracking-wide">
            Neo Brutalism Design System
          </p>
        </div>
      </footer>
    </main>
  )
}
