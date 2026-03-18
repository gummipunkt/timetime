import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, Users, BarChart3, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5MzMzZWEiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-60" />
        
        <nav className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-200">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-tight">TimeTime</span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
              Anmelden
            </Button>
          </Link>
        </nav>

        <div className="relative z-10 container mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Self-Hosted • Open Source • DSGVO-konform • GPL v3 Lizenz
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 tracking-tight">
            Zeiterfassung
            <span className="block bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              einfach gemacht
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Die moderne Lösung für Arbeitszeiterfassung und Urlaubsverwaltung. 
            Komplett selbst hostbar, datenschutzkonform und auf Ihre Bedürfnisse zugeschnitten.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white px-8 py-6 text-lg shadow-lg shadow-purple-200">
                Jetzt starten
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-6 text-lg">
              Dokumentation
            </Button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-violet-200/50 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-purple-200/50 rounded-full filter blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-fuchsia-200/30 rounded-full filter blur-3xl" />
      </header>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Alles was Sie brauchen
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Ein umfassendes System für moderne Arbeitszeiterfassung mit allen Features, die Ihr Unternehmen benötigt.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/80 border-purple-100 backdrop-blur-sm hover:border-violet-300 hover:shadow-lg hover:shadow-purple-100 transition-all group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center mb-4 group-hover:bg-violet-200 transition-colors">
                <Clock className="w-6 h-6 text-violet-600" />
              </div>
              <CardTitle className="text-gray-800">Echtzeit-Stempeln</CardTitle>
              <CardDescription className="text-gray-500">
                Kommen, Gehen und Pausen mit einem Klick erfassen. Live-Berechnung der Arbeitszeit.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 border-purple-100 backdrop-blur-sm hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100 transition-all group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-gray-800">Urlaubsverwaltung</CardTitle>
              <CardDescription className="text-gray-500">
                Anträge stellen, genehmigen und im Team-Kalender visualisieren.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 border-purple-100 backdrop-blur-sm hover:border-fuchsia-300 hover:shadow-lg hover:shadow-fuchsia-100 transition-all group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-fuchsia-100 flex items-center justify-center mb-4 group-hover:bg-fuchsia-200 transition-colors">
                <Users className="w-6 h-6 text-fuchsia-600" />
              </div>
              <CardTitle className="text-gray-800">Team-Management</CardTitle>
              <CardDescription className="text-gray-500">
                Abteilungen, Vorgesetzte und flexible Arbeitszeitmodelle verwalten.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 border-purple-100 backdrop-blur-sm hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100 transition-all group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle className="text-gray-800">Gleitzeit & Überstunden</CardTitle>
              <CardDescription className="text-gray-500">
                Automatische Berechnung von Soll/Ist-Zeiten und Gleitzeitsaldo.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 border-purple-100 backdrop-blur-sm hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 transition-all group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle className="text-gray-800">Rollen & Rechte</CardTitle>
              <CardDescription className="text-gray-500">
                Granulare Berechtigungen für Admin, Supervisor und Mitarbeiter.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 border-purple-100 backdrop-blur-sm hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100 transition-all group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center mb-4 group-hover:bg-rose-200 transition-colors">
                <Zap className="w-6 h-6 text-rose-600" />
              </div>
              <CardTitle className="text-gray-800">Feiertags-Kalender</CardTitle>
              <CardDescription className="text-gray-500">
                Automatische Berücksichtigung gesetzlicher Feiertage nach Bundesland.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-purple-200 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Bereit für moderne Zeiterfassung?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto mb-8">
              Starten Sie noch heute mit TimeTime. Vollständig selbst hostbar, 
              keine Cloud-Abhängigkeit, volle Kontrolle über Ihre Daten.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white px-8 py-6 text-lg shadow-lg shadow-purple-200">
                Demo starten
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-100 py-12 bg-white/50">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-800">TimeTime</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} TimeTime. Open Source Zeiterfassung für Unternehmen. GLP v3 Lizenz - <Link href="https://github.com/gummipunkt/TimeTime/">GitHub</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
