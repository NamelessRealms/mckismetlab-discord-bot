FROM node:16 AS BUILD

# Add package file
COPY package.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source
COPY src ./src
COPY tsconfig.json ./tsconfig.json

# Build tsc
RUN npm install typescript@4.6.2 -g
RUN tsc

# remove development dependencies
RUN npm prune --production

RUN export BOT_VERSION=$(npm pkg get version)

# Start production image build
FROM node:16-alpine

# copy from build image
COPY --from=BUILD /dist ./dist
COPY --from=BUILD /node_modules ./node_modules

# Add env
ENV NODE_ENV=production

CMD ["node", "dist/Main.js"]