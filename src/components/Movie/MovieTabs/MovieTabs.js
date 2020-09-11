import React, { PureComponent } from 'react';

import AccountsService from '../../../Services/AccountsService';

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Typography,
    Divider,
} from '@material-ui/core';
import { ExpandMore as ExpandMoreIcon } from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

import { torrentsSites, subtitlesSites } from './sites.json';

const StyledExpansionPanel = withStyles({ root: { color: 'white' } })(Accordion);
const StyledAccordionDetails = withStyles({
    root: { flexWrap: 'wrap', justifyContent: 'space-around' },
})(AccordionDetails);
const StyledAccordionSummary = withStyles({ expandIcon: { color: 'inherit' } })(AccordionSummary);
const StyledTypographyH6 = withStyles({
    root: { flexBasis: '33.33%', flexShrink: 0, textAlign: 'left', margin: 'auto 0' },
})(Typography);
const StyledTypographyMg = withStyles({ root: { margin: 'auto', color: 'inherit' } })(Typography);
const StyledDivider = withStyles({
    root: { height: '0.5px', backgroundColor: 'rgb(255 255 255 / 50%)' },
})(Divider);

class MovieTabs extends PureComponent {
    state = {
        expanded: false,
    };

    onTabChange = (panel) => (e, expanded) => {
        this.setState({ expanded: expanded && panel });
    };

    getRatings = () => {
        const { ratings } = this.props;

        if (!ratings || !ratings.length) return null;

        return ratings.map((rating) => (
            <Typography key={rating.Source} className="ratingsText" variant="body2">
                {rating.Source}: {rating.Value}
            </Typography>
        ));
    };

    getImdbRating = () => {
        const { imdbID, imdbRating } = this.props;
        return (
            <a
                href={`https://www.imdb.com/title/${imdbID}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                IMDb: {!imdbRating || imdbRating === 'N/A' ? 'N/A' : imdbRating}
            </a>
        );
    };

    getTorrentsLinks = () => {
        const { title, year } = this.props;
        const searchParams = `${title}+${year}`;
        return torrentsSites.map((site) => {
            let attributes = '';
            switch (site.name) {
                case 'RarBG':
                case 'TorrentDownloads':
                case 'LimeTorrents':
                    attributes = `${site.url}${searchParams}`;
                    break;
                case '1337X':
                    attributes = `${site.url}${searchParams}${site.urlExt}`;
                    break;
                case 'KickassTorrents':
                    attributes = `${site.url}${title} ${year}${site.urlExt}`;
                    break;
                default:
                    return <p></p>;
            }
            return (
                <a
                    key={site.name}
                    className="downloadSitesLinks"
                    href={attributes}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {site.name}
                </a>
            );
        });
    };

    getSubtitlesLinks = () => {
        const { imdbID, title } = this.props;
        return subtitlesSites.map((site) => {
            let attributes = '';
            switch (site.name) {
                case 'ScrewZira':
                    attributes = `${site.url}${title}`;
                    break;
                case 'Wizdom':
                    attributes = `${site.url}${imdbID}`;
                    break;
                default:
                    return <p></p>;
            }
            return (
                <a
                    key={site.name}
                    className="downloadSitesLinks"
                    href={attributes}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {site.name}
                </a>
            );
        });
    };

    getActors = () => {
        const actors = this.props.actors && this.props.actors.split(',');
        if (!actors) return [];
        return actors.map((actor) => (
            <a
                key={actor.trim()}
                className="actor"
                href={`https://en.wikipedia.org/wiki/${actor.trim()}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
            >
                {actor.trim()}
            </a>
        ));
    };

    getFullCast = () => {
        return (
            <a
                href={`https://www.imdb.com/title/${this.props.imdbID}/fullcredits/`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
            >
                more
            </a>
        );
    };

    render() {
        const { expanded } = this.state;
        const { watchMode, genre, plot } = this.props;
        const userEmail = !watchMode ? AccountsService.GetLoggedInUser().email : '';

        const ratings = this.getRatings();
        const imdbRating = ratings && this.getImdbRating();
        const torrentsLinks = this.getTorrentsLinks();
        const subtitlesLinks = this.getSubtitlesLinks();
        const [leadingActor, ...supportingActors] = this.getActors();
        const fullCast = this.getFullCast();

        return (
            <div>
                <StyledExpansionPanel
                    className="tabsPanel"
                    expanded={expanded === 'panel1'}
                    onChange={this.onTabChange('panel1')}
                >
                    <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <StyledTypographyH6 variant="h6">Plot</StyledTypographyH6>
                        <StyledTypographyMg variant="subtitle2">{genre}</StyledTypographyMg>
                    </StyledAccordionSummary>
                    <AccordionDetails>{plot || ''}</AccordionDetails>
                </StyledExpansionPanel>

                <StyledExpansionPanel
                    className="tabsPanel"
                    expanded={expanded === 'panel2'}
                    onChange={this.onTabChange('panel2')}
                >
                    <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <StyledTypographyH6 variant="h6">Cast</StyledTypographyH6>
                        <StyledTypographyMg variant="subtitle2">
                            {leadingActor}& {fullCast}
                        </StyledTypographyMg>
                    </StyledAccordionSummary>
                    <AccordionDetails>
                        <StyledTypographyMg variant="body2">{supportingActors}</StyledTypographyMg>
                    </AccordionDetails>
                </StyledExpansionPanel>

                {ratings && (
                    <StyledExpansionPanel
                        className="tabsPanel"
                        expanded={expanded === 'panel3'}
                        onChange={this.onTabChange('panel3')}
                    >
                        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <StyledTypographyH6 variant="h6">Ratings</StyledTypographyH6>
                            <StyledTypographyMg variant="subtitle2">
                                {imdbRating}
                            </StyledTypographyMg>
                        </StyledAccordionSummary>
                        <AccordionDetails>{ratings}</AccordionDetails>
                    </StyledExpansionPanel>
                )}

                {userEmail === atob(process.env.REACT_APP_EMAIL_BTOA) && (
                    <StyledExpansionPanel
                        className="tabsPanel"
                        expanded={expanded === 'panel4'}
                        onChange={this.onTabChange('panel4')}
                    >
                        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <StyledTypographyH6 variant="h6">Downloads</StyledTypographyH6>
                            <StyledTypographyMg variant="subtitle2">
                                Torrents & Subtitles
                            </StyledTypographyMg>
                        </StyledAccordionSummary>
                        <StyledAccordionDetails>{torrentsLinks}</StyledAccordionDetails>
                        <StyledDivider variant="middle"></StyledDivider>
                        <StyledAccordionDetails>{subtitlesLinks}</StyledAccordionDetails>
                    </StyledExpansionPanel>
                )}
            </div>
        );
    }
}

export default MovieTabs;
