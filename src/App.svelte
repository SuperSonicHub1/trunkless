<!-- TODO: https://github.com/metonym/svelte-primer -->
<!-- svelte-primer isn't ready for prime-time. (hahaha) -->
<!-- Should use Primer CSS straight and make my own component lib, as much as I don't want to. -->

<script lang="ts">
	import Router, { link } from 'svelte-spa-router'
	import online  from "./lib/online"
    import Home from './pages/Home.svelte'
    import Jobs from './pages/Jobs.svelte'
	import { jobCount } from "./lib/jobs"
    import Follows from './pages/Follows.svelte'
    import Account from './pages/Account.svelte'
    import NotFound from './pages/NotFound.svelte'
    import StatusPage from './pages/StatusPage.svelte'
	import './lib/logging'

	const routes = {
		'/': Home,
		'/follows': Follows,
		'/jobs': Jobs,
		// TODO: This routes situation sucks...
		'/:handle': Account,
		'/:handle/:status_id': StatusPage,
		'*': NotFound,
	}

	const onlineText = $online ? 'Online' : 'Offline'
</script>

<nav>
	<h1>Trunkless</h1>
	<a use:link href="/">Home</a>
	<span role='none'>|</span>
	<a use:link href="/follows">Follows</a>
	<span role='none'>|</span>
	<a use:link href="/jobs">{ $jobCount } Job{$jobCount === 1 ? '' : 's'}</a>
	<span role='none'>|</span>
	<span title={onlineText} aria-label={onlineText} role="img" >{$online ? '🌐' : '🚫🌐'}</span>
</nav>
<main>
	<Router {routes} restoreScrollState={true} />
</main>


