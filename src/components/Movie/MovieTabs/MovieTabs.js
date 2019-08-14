import React, { PureComponent } from 'react';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Divider from '@material-ui/core/Divider';

import { withStyles } from '@material-ui/core/styles';
import './MovieTabs.css';

const torrentsSites = [
	{ "name": "RarBG", "url": "https://rarbgtor.org/torrents.php?search=" },
	{ "name": "TorrentDownloads", "url": "https://www.torrentdownloads.me/search/?s_cat=4&search=" },
	{ "name": "LimeTorrents", "url": "https://www.limetorrents.info/search/movie/" },
	{ "name": "1337X", "url": "https://1337x.to/category-search/", "urlExt": "/Movies/1/" },
	{ "name": "KickassTorrents", "url": " https://kat.rip/usearch/", "urlExt": " category:movies/" }
];

const subtitlesSites = [
	{ "name": "Subcenter", "url": "http://www.subscenter.biz/he/subtitle/search/?q=" },
	{ "name": "ScrewZira", "url": "https://www.screwzira.com/Search.aspx?q=" },
	{ "name": "Wizdom", "url": "https://wizdom.xyz/#/movies/" }
];

const StyledExpansionPanel = withStyles({ root: { color: 'inherit' } })(ExpansionPanel);
const StyledExpansionPanelDetails = withStyles({ root: { color: 'inherit', padding: '8px 10px' } })(ExpansionPanelDetails);
const StyledExpansionPanelDetailsFlexWrap = withStyles({ root: { color: 'inherit', padding: '8px 10px', flexWrap: 'wrap' } })(ExpansionPanelDetails);
const StyledExpansionPanelSummary = withStyles({ content: { color: 'inherit' }, expanded: { color: 'inherit' }, expandIcon: { color: 'inherit' } })(ExpansionPanelSummary);
const StyledTypographyH6 = withStyles({ root: { flexBasis: '33.33%', flexShrink: 0, textAlign: 'left', margin: 'auto 0', color: 'white' } })(Typography);
const StyledTypographyMg = withStyles({ root: { margin: 'auto' } })(Typography);

class MovieTabs extends PureComponent {

	state = {
		expanded: false
	};

	handleChange = panel => (e, expanded) => { this.setState({ expanded: expanded && panel }); };

	render() {
		const { expanded } = this.state;
		const { userEmail } = this.props;
		const searchParams = `${this.props.title}+${this.props.year}`;
		let ratings = "";

		if (this.props.ratings) {
			ratings = this.props.ratings.map(rating => <Typography key={rating.Source} className="ratingsText" variant="body2">
				{rating.Source}: {rating.Value}</Typography>);
		}

		const imdbRating = <a href={`https://www.imdb.com/title/${this.props.imdbID}`} target="_blank" rel="noopener noreferrer">
			IMDb: {this.props.imdbRating === "N/A" ? "N/A" : this.props.imdbRating}</a>;

		const torrents = torrentsSites.map(site => {
			let attributes = "";
			switch (site.name) {
				case "RarBG":
				case "TorrentDownloads":
				case "LimeTorrents": attributes = `${site.url}${searchParams}`; break;
				case "1337X": attributes = `${site.url}${searchParams}${site.urlExt}`; break;
				case "KickassTorrents": attributes = `${site.url}${this.props.title} ${this.props.year}${site.urlExt}`; break;
				default: return <p></p>;
			}
			return <a key={site.name} className="downloadSitesLinks" href={attributes} target="_blank" rel="noopener noreferrer">{site.name}</a>
		});

		const subtitles = subtitlesSites.map(site => {
			let attributes = "";
			switch (site.name) {
				case "Subcenter":
				case "ScrewZira": attributes = `${site.url}${this.props.title}`; break;
				case "Wizdom": attributes = `${site.url}${this.props.imdbID}`; break;
				default: return <p></p>;
			}
			return <a key={site.name} className="downloadSitesLinks" href={attributes} target="_blank" rel="noopener noreferrer">{site.name}</a>
		});

		const actors = this.props.actors.split(',').map(actor => (
			<a key={actor.trim()} className="actorsList" href={`https://en.wikipedia.org/wiki/${actor}`} target="_blank" rel="noopener noreferrer"
				onClick={e => e.stopPropagation()}> {actor.trim()}</a>
		));

		const mainActor = actors[0];
		const fullcast = <a href={`https://www.imdb.com/title/${this.props.imdbID}/fullcredits/`} target="_blank" rel="noopener noreferrer"
			onClick={e => e.stopPropagation()}>more</a>;

		return (
			<div>

				<StyledExpansionPanel className="tabsPanel" expanded={expanded === "panel1"} onChange={this.handleChange("panel1")} >
					<StyledExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
						<StyledTypographyH6 color="inherit" variant="h6">Plot</StyledTypographyH6>
						<StyledTypographyMg color="inherit" variant="subtitle2">{this.props.genre}</StyledTypographyMg>
					</StyledExpansionPanelSummary>
					<StyledExpansionPanelDetails>{this.props.plot || ""}</StyledExpansionPanelDetails>
				</StyledExpansionPanel>

				<StyledExpansionPanel className="tabsPanel" expanded={expanded === "panel2"} onChange={this.handleChange("panel2")} >
					<StyledExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
						<StyledTypographyH6 color="inherit" variant="h6">Cast</StyledTypographyH6>
						<StyledTypographyMg color="inherit" variant="subtitle2">{mainActor}& {fullcast}</StyledTypographyMg>
					</StyledExpansionPanelSummary>
					<StyledExpansionPanelDetails>
						<StyledTypographyMg color="inherit" variant="body2">{actors.splice(1)}</StyledTypographyMg>
					</StyledExpansionPanelDetails>
				</StyledExpansionPanel>

				<StyledExpansionPanel className="tabsPanel" expanded={expanded === "panel3"} onChange={this.handleChange("panel3")} >
					<StyledExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
						<StyledTypographyH6 color="inherit" variant="h6">Ratings</StyledTypographyH6>
						<StyledTypographyMg color="inherit" variant="subtitle2">{imdbRating}</StyledTypographyMg>
					</StyledExpansionPanelSummary>
					<StyledExpansionPanelDetails>{ratings}</StyledExpansionPanelDetails>
				</StyledExpansionPanel>

				{userEmail === "m141084@gmail.com" &&
					<StyledExpansionPanel className="tabsPanel" expanded={expanded === "panel4"} onChange={this.handleChange("panel4")} >
						<StyledExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
							<StyledTypographyH6 color="inherit" variant="h6">Downloads</StyledTypographyH6>
							<StyledTypographyMg color="inherit" variant="subtitle2">Torrents & Subtitles</StyledTypographyMg>
						</StyledExpansionPanelSummary>
						<StyledExpansionPanelDetailsFlexWrap>{torrents}</StyledExpansionPanelDetailsFlexWrap>
						<Divider variant="middle"></Divider>
						<StyledExpansionPanelDetailsFlexWrap>{subtitles}</StyledExpansionPanelDetailsFlexWrap>
					</StyledExpansionPanel>}

			</div >
		);
	}
}

export default MovieTabs;