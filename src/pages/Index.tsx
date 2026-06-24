import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const AUTH_URL = 'https://functions.poehali.dev/1716385b-6d71-4ee5-956d-072b85248157';

interface User {
  id: number;
  username: string;
  email: string;
  coins: number;
}

const COVER_1 = 'https://cdn.poehali.dev/projects/42eab537-72c4-4eb0-8417-103f41796391/files/849b7f27-3633-4869-b5d3-469a1af2ac83.jpg';
const COVER_2 = 'https://cdn.poehali.dev/projects/42eab537-72c4-4eb0-8417-103f41796391/files/981f4647-334a-4942-9d80-2fa6ae09fbfe.jpg';

interface Game {
  id: number;
  title: string;
  genre: string;
  cover: string;
  free: boolean;
  price: number;
  rating: number;
  popular: boolean;
}

const GENRES = ['Все', 'Экшен', 'RPG', 'Шутер', 'Стратегия', 'Космос', 'Инди'];

const GAMES: Game[] = [
  { id: 1, title: 'Neon Striker', genre: 'Экшен', cover: COVER_1, free: true, price: 0, rating: 4.8, popular: true },
  { id: 2, title: 'Void Horizon', genre: 'Космос', cover: COVER_2, free: true, price: 0, rating: 4.6, popular: true },
  { id: 3, title: 'Cyber Reign', genre: 'RPG', cover: COVER_1, free: false, price: 1200, rating: 4.9, popular: true },
  { id: 4, title: 'Star Vanguard', genre: 'Шутер', cover: COVER_2, free: false, price: 900, rating: 4.5, popular: false },
  { id: 5, title: 'Pulse Arena', genre: 'Экшен', cover: COVER_1, free: true, price: 0, rating: 4.3, popular: false },
  { id: 6, title: 'Nebula Tactics', genre: 'Стратегия', cover: COVER_2, free: false, price: 1500, rating: 4.7, popular: true },
  { id: 7, title: 'Glitch Runner', genre: 'Инди', cover: COVER_1, free: true, price: 0, rating: 4.2, popular: false },
  { id: 8, title: 'Dark Matter', genre: 'RPG', cover: COVER_2, free: false, price: 2000, rating: 5.0, popular: true },
];

const TORRENT_PACKS = [
  { name: 'Starter Pack', count: 25, size: '40 ГБ', icon: 'Package', color: 'cyan' },
  { name: 'Mega Pack', count: 60, size: '120 ГБ', icon: 'Boxes', color: 'magenta' },
  { name: 'Ultimate Pack', count: 100, size: '250 ГБ', icon: 'HardDrive', color: 'purple' },
];

const INSTRUCTIONS = [
  { step: '01', title: 'Скачайте торрент-клиент', text: 'Установите qBittorrent или uTorrent для загрузки.' },
  { step: '02', title: 'Выберите пак игр', text: 'Откройте нужный торрент-пак и скачайте .torrent файл.' },
  { step: '03', title: 'Запустите загрузку', text: 'Добавьте файл в клиент и дождитесь окончания скачивания.' },
  { step: '04', title: 'Установите и играйте', text: 'Распакуйте архив, запустите установщик — готово!' },
];

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [coins, setCoins] = useState(0);
  const [filter, setFilter] = useState('Все');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [earning, setEarning] = useState(false);

  // Восстанавливаем сессию
  useEffect(() => {
    const saved = localStorage.getItem('steam2_user');
    if (saved) {
      const u = JSON.parse(saved) as User;
      setUser(u);
      setCoins(u.coins);
    }
  }, []);

  useEffect(() => {
    if (!earning) return;
    if (secondsLeft <= 0) {
      setCoins((c) => c + 300);
      setEarning(false);
      setSecondsLeft(30);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [earning, secondsLeft]);

  const handleAuth = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const body = authMode === 'register'
        ? { action: 'register', username: authForm.username, email: authForm.email, password: authForm.password }
        : { action: 'login', email: authForm.email, password: authForm.password };

      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Ошибка авторизации');
        return;
      }
      localStorage.setItem('steam2_user', JSON.stringify(data.user));
      setUser(data.user);
      setCoins(data.user.coins);
      setAuthOpen(false);
      setAuthForm({ username: '', email: '', password: '' });
    } catch {
      setAuthError('Ошибка соединения с сервером');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('steam2_user');
    setUser(null);
    setCoins(0);
  };

  const filtered = GAMES.filter((g) => {
    const byGenre = filter === 'Все' || g.genre === filter;
    const byFree = !showFreeOnly || g.free;
    return byGenre && byFree;
  });

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center neon-glow">
              <Icon name="Gamepad2" className="text-primary-foreground" size={22} />
            </div>
            <span className="font-display text-xl text-primary neon-text">STEAM2</span>
          </button>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => scrollTo('catalog')} className="hover:text-primary transition-colors">Каталог</button>
            <button onClick={() => scrollTo('free')} className="hover:text-primary transition-colors">Бесплатные</button>
            <button onClick={() => scrollTo('packs')} className="hover:text-primary transition-colors">Торрент-паки</button>
            <button onClick={() => scrollTo('account')} className="hover:text-primary transition-colors">Кабинет</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-primary transition-colors">Контакты</button>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border">
              <Icon name="Coins" className="text-neon-magenta" size={16} />
              <span className="font-display text-sm">{coins}</span>
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:block">Привет, <span className="text-foreground font-medium">{user.username}</span></span>
                <Button size="sm" variant="outline" onClick={handleLogout} className="border-border text-muted-foreground hover:text-foreground">
                  <Icon name="LogOut" size={15} />
                </Button>
              </div>
            ) : (
              <Dialog open={authOpen} onOpenChange={(o) => { setAuthOpen(o); setAuthError(''); }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">
                    Войти
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display text-primary neon-text text-2xl">
                      {authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    {authMode === 'register' && (
                      <Input
                        placeholder="Никнейм"
                        className="bg-secondary border-border"
                        value={authForm.username}
                        onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                      />
                    )}
                    <Input
                      placeholder="Email"
                      type="email"
                      className="bg-secondary border-border"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    />
                    <Input
                      placeholder="Пароль"
                      type="password"
                      className="bg-secondary border-border"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    />
                    {authError && (
                      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                        <Icon name="CircleAlert" size={15} />
                        {authError}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon name="ShieldCheck" className="text-primary" size={16} />
                      Защита аккаунта: шифрование и двухфакторная проверка
                    </div>
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                      onClick={handleAuth}
                      disabled={authLoading}
                    >
                      {authLoading
                        ? <><Icon name="Loader" size={16} className="mr-2 animate-spin" /> Загрузка...</>
                        : authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
                    </Button>
                    <button
                      onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                      className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="hero" className="relative overflow-hidden grid-bg">
        <div className="container py-24 md:py-32 relative z-10">
          <div className="max-w-3xl animate-fade-in">
            <Badge className="mb-6 bg-accent/20 text-neon-magenta border border-accent/40 hover:bg-accent/20">
              <Icon name="Zap" size={14} className="mr-1" /> 100 игр бесплатно
            </Badge>
            <h1 className="text-5xl md:text-7xl font-display leading-none mb-6">
              ИГРАЙ <span className="text-primary neon-text">БЕЗ</span><br />
              <span className="text-neon-magenta neon-text-magenta">ОГРАНИЧЕНИЙ</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Игровая платформа нового поколения. Скачивай игры через торрент-паки,
              зарабатывай монеты и открывай платные тайтлы бесплатно.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => scrollTo('catalog')} className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow font-display text-base">
                <Icon name="Rocket" size={18} className="mr-2" /> Открыть каталог
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo('free')} className="border-primary/50 text-primary hover:bg-primary/10 font-display text-base">
                Бесплатные игры
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 hidden lg:block opacity-30">
          <img src={COVER_1} alt="" className="w-full h-full object-cover [mask-image:linear-gradient(to_right,transparent,black)]" />
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border bg-card/40">
        <div className="container grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { n: '100+', l: 'Бесплатных игр' },
            { n: '5000+', l: 'Игр в каталоге' },
            { n: '50K', l: 'Игроков' },
            { n: '24/7', l: 'Поддержка' },
          ].map((s) => (
            <div key={s.l} className="py-8 text-center">
              <div className="font-display text-3xl md:text-4xl text-primary neon-text">{s.n}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COINS */}
      <section id="coins" className="container py-20">
        <div className="glass rounded-2xl border border-accent/30 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <Badge className="mb-4 bg-neon-magenta/20 text-neon-magenta border border-accent/40">Система монет</Badge>
              <h2 className="text-3xl md:text-4xl mb-4">Зарабатывай <span className="text-neon-magenta neon-text-magenta">монеты</span></h2>
              <p className="text-muted-foreground mb-2">
                Оставайся на сайте 30 секунд — и получи 300 монет. Трать их на платные игры из каталога.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="Coins" className="text-neon-magenta" size={16} />
                Текущий баланс: <span className="font-display text-foreground">{coins} монет</span>
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-7xl text-primary neon-text mb-4">
                {earning ? `00:${secondsLeft.toString().padStart(2, '0')}` : '+300'}
              </div>
              <Button
                size="lg"
                disabled={earning}
                onClick={() => setEarning(true)}
                className="bg-neon-magenta text-accent-foreground hover:bg-neon-magenta/90 font-display"
              >
                {earning ? (
                  <><Icon name="Loader" size={18} className="mr-2 animate-spin" /> Начисляем...</>
                ) : (
                  <><Icon name="Gift" size={18} className="mr-2" /> Получить 300 монет</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="container py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl mb-2">Каталог <span className="text-primary neon-text">игр</span></h2>
            <p className="text-muted-foreground text-sm">Фильтруй по жанрам и популярности</p>
          </div>
          <Button
            variant={showFreeOnly ? 'default' : 'outline'}
            onClick={() => setShowFreeOnly(!showFreeOnly)}
            className={showFreeOnly ? 'bg-primary text-primary-foreground' : 'border-border'}
          >
            <Icon name="Sparkles" size={16} className="mr-2" /> Только бесплатные
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === g
                  ? 'bg-primary text-primary-foreground neon-glow'
                  : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Игр по этому фильтру не найдено.</p>
        )}
      </section>

      {/* FREE GAMES */}
      <section id="free" className="container py-20">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="Sparkles" className="text-primary" size={28} />
            <h2 className="text-3xl md:text-4xl">100 <span className="text-primary neon-text">бесплатных</span> игр</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Целая сотня игр доступна бесплатно — без монет и подписок. Качай и играй прямо сейчас.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {GAMES.filter((g) => g.free).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>

      {/* TORRENT PACKS */}
      <section id="packs" className="container py-12">
        <h2 className="text-3xl md:text-4xl mb-2 text-center">Торрент-<span className="text-neon-purple neon-text">паки</span></h2>
        <p className="text-muted-foreground text-sm text-center mb-10">Выбери пак и скачай игры одним архивом</p>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {TORRENT_PACKS.map((p) => (
            <div key={p.name} className="glass rounded-2xl border border-border p-6 hover-scale group">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                p.color === 'cyan' ? 'bg-primary/20' : p.color === 'magenta' ? 'bg-accent/20' : 'bg-neon-purple/20'
              }`}>
                <Icon name={p.icon} className={
                  p.color === 'cyan' ? 'text-primary' : p.color === 'magenta' ? 'text-neon-magenta' : 'text-neon-purple'
                } size={28} />
              </div>
              <h3 className="text-xl mb-2">{p.name}</h3>
              <div className="flex gap-4 text-sm text-muted-foreground mb-5">
                <span className="flex items-center gap-1"><Icon name="Gamepad2" size={14} /> {p.count} игр</span>
                <span className="flex items-center gap-1"><Icon name="Database" size={14} /> {p.size}</span>
              </div>
              <Button className="w-full bg-secondary hover:bg-primary hover:text-primary-foreground border border-border transition-colors">
                <Icon name="Download" size={16} className="mr-2" /> Скачать .torrent
              </Button>
            </div>
          ))}
        </div>

        <h3 className="text-2xl mb-8 text-center">Инструкция по установке</h3>
        <div className="grid md:grid-cols-4 gap-5">
          {INSTRUCTIONS.map((i) => (
            <div key={i.step} className="relative p-6 rounded-xl bg-card/60 border border-border">
              <span className="font-display text-5xl text-primary/30 absolute top-3 right-4">{i.step}</span>
              <Icon name="ChevronRight" className="text-primary mb-3" size={22} />
              <h4 className="text-base mb-2">{i.title}</h4>
              <p className="text-sm text-muted-foreground">{i.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACCOUNT */}
      <section id="account" className="container py-20">
        <div className="glass rounded-2xl border border-border p-8 md:p-10">
          {!user && (
            <div className="text-center py-10">
              <Icon name="LockKeyhole" className="text-muted-foreground mx-auto mb-4" size={40} />
              <h2 className="text-2xl mb-2">Войдите в аккаунт</h2>
              <p className="text-muted-foreground mb-6">Чтобы увидеть личный кабинет, сначала войдите или зарегистрируйтесь.</p>
              <Button onClick={() => setAuthOpen(true)} className="bg-primary text-primary-foreground neon-glow">
                Войти / Зарегистрироваться
              </Button>
            </div>
          )}
          {user && (
          <>
          <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-neon-purple flex items-center justify-center neon-glow">
                <Icon name="User" className="text-primary-foreground" size={32} />
              </div>
              <div>
                <h2 className="text-2xl mb-1">{user.username}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Icon name="ShieldCheck" className="text-primary" size={14} /> {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border">
              <Icon name="Coins" className="text-neon-magenta" size={20} />
              <span className="font-display text-xl">{coins}</span>
              <span className="text-xs text-muted-foreground">монет</span>
            </div>
          </div>

          <Tabs defaultValue="library">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="library">Мои игры</TabsTrigger>
              <TabsTrigger value="downloads">Скачанные</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {GAMES.slice(0, 4).map((g) => (
                  <GameCard key={g.id} game={g} owned />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="downloads" className="pt-6">
              <div className="space-y-3">
                {GAMES.slice(0, 3).map((g) => (
                  <div key={g.id} className="flex items-center gap-4 p-3 rounded-xl bg-card/60 border border-border">
                    <img src={g.cover} alt={g.title} className="w-16 h-12 rounded-md object-cover" />
                    <div className="flex-1">
                      <div className="font-display text-sm">{g.title}</div>
                      <div className="text-xs text-muted-foreground">{g.genre} · Загружено</div>
                    </div>
                    <Icon name="CircleCheck" className="text-primary" size={20} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          </>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="container py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-3xl md:text-4xl mb-4">Обратная <span className="text-primary neon-text">связь</span></h2>
            <p className="text-muted-foreground mb-8">Есть вопрос или предложение? Напиши нам — ответим быстро.</p>
            <div className="space-y-4">
              {[
                { icon: 'Mail', label: 'support@steam2.io' },
                { icon: 'Send', label: '@steam2_support' },
                { icon: 'MapPin', label: 'Орбитальная станция «Geek-1»' },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center">
                    <Icon name={c.icon} className="text-primary" size={18} />
                  </div>
                  <span className="text-sm">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
          <form className="glass rounded-2xl border border-border p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Input placeholder="Ваше имя" className="bg-secondary border-border" />
            <Input placeholder="Email" type="email" className="bg-secondary border-border" />
            <Textarea placeholder="Сообщение" rows={4} className="bg-secondary border-border resize-none" />
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow font-display">
              <Icon name="Send" size={16} className="mr-2" /> Отправить
            </Button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border mt-12">
        <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Icon name="Gamepad2" className="text-primary" size={20} />
            <span className="font-display text-primary">STEAM2</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 STEAM2 — Игровая платформа нового поколения</p>
          <div className="flex gap-3">
            {['Github', 'Twitter', 'Youtube'].map((s) => (
              <a key={s} href="#" className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:text-primary transition-colors">
                <Icon name={s} size={16} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

const GameCard = ({ game, owned }: { game: Game; owned?: boolean }) => (
  <div className="group rounded-xl overflow-hidden bg-card border border-border hover-scale hover:border-primary/50 transition-colors">
    <div className="relative aspect-[3/4] overflow-hidden">
      <img src={game.cover} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      {game.popular && (
        <Badge className="absolute top-2 left-2 bg-neon-magenta/90 text-accent-foreground border-0 text-[10px]">
          <Icon name="Flame" size={10} className="mr-0.5" /> ТОП
        </Badge>
      )}
      <Badge className={`absolute top-2 right-2 border-0 text-[10px] ${game.free ? 'bg-primary/90 text-primary-foreground' : 'bg-secondary/90'}`}>
        {game.free ? 'FREE' : `${game.price}`}
      </Badge>
    </div>
    <div className="p-3">
      <div className="font-display text-sm truncate mb-1">{game.title}</div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{game.genre}</span>
        <span className="flex items-center gap-0.5">
          <Icon name="Star" size={12} className="text-neon-magenta fill-neon-magenta" /> {game.rating}
        </span>
      </div>
      <Button size="sm" className="w-full mt-3 bg-secondary hover:bg-primary hover:text-primary-foreground border border-border transition-colors text-xs h-8">
        {owned ? (
          <><Icon name="Play" size={12} className="mr-1" /> Играть</>
        ) : game.free ? (
          <><Icon name="Download" size={12} className="mr-1" /> Скачать</>
        ) : (
          <><Icon name="Coins" size={12} className="mr-1" /> {game.price}</>
        )}
      </Button>
    </div>
  </div>
);

export default Index;